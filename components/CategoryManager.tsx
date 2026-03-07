import AnimatedPressable from '@/components/AnimatedPressable';
import { C, R, SP } from '@/constants/design';
import { Category, useStore } from '@/store';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PRESET_COLORS = [
    '#FF3B30', '#FF6B35', '#F5A623', '#F5C542',
    '#4ECB71', '#00C805', '#3693F5', '#5B8DEF',
    '#B07FE0', '#A259FF', '#FF69B4', '#8E8E93',
    '#24292e', '#000000',
];

const PRESET_ICONS = [
    '🎭', '⚡', '💚', '💰', '📚', '📦', '🎮', '🎵',
    '🏋️', '🍔', '🚗', '🏠', '✈️', '👔', '💻', '📱',
    '🎬', '☁️', '🔒', '🛒',
];

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function CategoryManager({ visible, onClose }: Props) {
    const { categories, subs, addCategory, updateCategory, removeCategory, reorderCategories } = useStore();
    const [editing, setEditing] = useState<Category | null>(null);
    const [adding, setAdding] = useState(false);

    const subCountFor = (catId: string) => subs.filter(s => s.categoryId === catId).length;

    const handleDelete = (cat: Category) => {
        const count = subCountFor(cat.id);
        if (count > 0) {
            const otherCat = categories.find(c => c.id !== cat.id) ?? categories[0];
            Alert.alert(
                'Delete category?',
                `${count} subscription${count > 1 ? 's' : ''} will be moved to "${otherCat.name}"`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { removeCategory(cat.id, otherCat.id); setEditing(null); } },
                ],
            );
        } else {
            removeCategory(cat.id, categories.find(c => c.id !== cat.id)?.id ?? 'cat_other');
            setEditing(null);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                <View style={s.sheet}>
                    <View style={s.handle} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={s.title}>Categories</Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Text style={{ fontSize: 14, color: C.t2, fontWeight: '500' }}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        {(editing || adding) ? (
                            <CategoryForm
                                initial={editing ?? undefined}
                                onSave={(data) => {
                                    if (editing) {
                                        updateCategory({ ...editing, ...data });
                                        setEditing(null);
                                    } else {
                                        addCategory({ ...data, id: `cat_${Date.now()}`, sortOrder: categories.length, isDefault: false });
                                        setAdding(false);
                                    }
                                }}
                                onCancel={() => { setEditing(null); setAdding(false); }}
                                onDelete={editing ? () => handleDelete(editing) : undefined}
                                isDefault={editing?.isDefault}
                            />
                        ) : (
                            <>
                                {categories.map(cat => (
                                    <AnimatedPressable
                                        key={cat.id}
                                        onPress={() => setEditing(cat)}
                                        style={s.catRow}
                                    >
                                        <View style={[s.catIcon, { backgroundColor: `${cat.color}18` }]}>
                                            <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.catName}>{cat.name}</Text>
                                            <Text style={s.catSub}>{subCountFor(cat.id)} subscriptions</Text>
                                        </View>
                                        <View style={[s.colorSwatch, { backgroundColor: cat.color }]} />
                                        <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                                            <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                                        </Svg>
                                    </AnimatedPressable>
                                ))}

                                <AnimatedPressable onPress={() => setAdding(true)} style={s.addRow}>
                                    <Text style={s.addLabel}>+ Add category</Text>
                                </AnimatedPressable>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function CategoryForm({
    initial,
    onSave,
    onCancel,
    onDelete,
    isDefault,
}: {
    initial?: Category;
    onSave: (data: Pick<Category, 'name' | 'icon' | 'color'>) => void;
    onCancel: () => void;
    onDelete?: () => void;
    isDefault?: boolean;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [icon, setIcon] = useState(initial?.icon ?? '📦');
    const [color, setColor] = useState(initial?.color ?? '#8E8E93');

    const canSave = name.trim().length > 0;

    return (
        <View>
            <Text style={s.fieldLabel}>NAME</Text>
            <TextInput
                style={s.inp}
                value={name}
                onChangeText={setName}
                placeholder="Category name"
                placeholderTextColor={C.t3}
                autoFocus
            />

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>ICON</Text>
            <View style={s.grid}>
                {PRESET_ICONS.map(ic => (
                    <TouchableOpacity
                        key={ic}
                        onPress={() => setIcon(ic)}
                        style={[s.gridCell, icon === ic && { backgroundColor: C.bgSub, borderColor: C.t1 }]}
                        activeOpacity={0.7}
                    >
                        <Text style={{ fontSize: 20 }}>{ic}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>COLOR</Text>
            <View style={s.grid}>
                {PRESET_COLORS.map(c => (
                    <TouchableOpacity
                        key={c}
                        onPress={() => setColor(c)}
                        style={[s.colorCell, { backgroundColor: c }, color === c && { borderWidth: 2.5, borderColor: C.t1 }]}
                        activeOpacity={0.7}
                    />
                ))}
            </View>

            {/* Preview */}
            <View style={[s.preview, { backgroundColor: `${color}18` }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color }}>{name || 'Category'}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <AnimatedPressable
                    onPress={() => canSave && onSave({ name, icon, color })}
                    style={[s.btn, { flex: 2, backgroundColor: canSave ? C.black : C.bgSub, opacity: canSave ? 1 : 0.5 }]}
                    disabled={!canSave}
                >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: canSave ? '#fff' : C.t3 }}>
                        {initial ? 'Save' : 'Add category'}
                    </Text>
                </AnimatedPressable>
                {onDelete && !isDefault && (
                    <AnimatedPressable onPress={onDelete} style={[s.btn, { flex: 1, backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redLine }]}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: C.red }}>Delete</Text>
                    </AnimatedPressable>
                )}
            </View>

            <TouchableOpacity onPress={onCancel} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 8 }} activeOpacity={0.7}>
                <Text style={{ color: C.t3, fontSize: 14, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: 12, paddingHorizontal: SP[4], paddingBottom: 40, maxHeight: '85%',
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 20,
    },
    title: {
        fontSize: 18, fontWeight: '700', color: C.t1,
    },
    catRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line,
    },
    catIcon: {
        width: 40, height: 40, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center',
    },
    catName: {
        fontSize: 14, fontWeight: '600', color: C.t1,
    },
    catSub: {
        fontSize: 12, color: C.t3, marginTop: 2,
    },
    colorSwatch: {
        width: 16, height: 16, borderRadius: 8, marginRight: 4,
    },
    addRow: {
        paddingVertical: 16, alignItems: 'center',
    },
    addLabel: {
        fontSize: 14, fontWeight: '600', color: C.t2,
    },
    fieldLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 8,
    },
    inp: {
        backgroundColor: C.bgSub, borderRadius: R.md, padding: 14,
        fontSize: 16, fontWeight: '500', color: C.t1,
    },
    grid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    },
    gridCell: {
        width: 44, height: 44, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: C.line,
    },
    colorCell: {
        width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent',
    },
    preview: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 12, borderRadius: R.md, marginTop: 16,
    },
    btn: {
        paddingVertical: 15, borderRadius: R.pill, alignItems: 'center',
    },
});
