import { C, R, SP } from '@/constants/design';
import React, { useState } from 'react';
import {
    Modal, ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BrandLogo from './BrandLogo';

const ICON_TABS = [
    { id: 'entertainment', label: 'Entertain', icons: ['🎬', '🎵', '▶️', '📺', '🎮', '🎧', '🎤', '🎶'] },
    { id: 'productivity', label: 'Productivity', icons: ['💻', '⌨️', '📊', '✏️', '📁', '🔧', '📎', '🗂️'] },
    { id: 'lifestyle', label: 'Lifestyle', icons: ['🏋️', '🏠', '🚗', '✈️', '☕', '🍕', '🧘', '❤️'] },
    { id: 'finance', label: 'Finance', icons: ['💳', '🏦', '📈', '🧾', '🛒', '💵', '💎', '💰'] },
    { id: 'utilities', label: 'Utilities', icons: ['🔒', '🌐', '📱', '☁️', '💡', '🔔', '⭐', '🛡️'] },
];

const SVG_ICON_TABS = [
    { id: 'svg_utilities', label: 'Utilities', icons: ['phone', 'wifi', 'electricity', 'water', 'rent', 'gas', 'parking', 'insurance', 'car-insurance', 'vpn', 'cloud-storage', 'laundry'] },
    { id: 'svg_entertainment', label: 'Entertain', icons: ['music-note', 'film', 'gamepad', 'book', 'headphones', 'camera', 'microphone', 'palette'] },
    { id: 'svg_life', label: 'Life', icons: ['baby', 'pet-paw', 'heart', 'food-utensils', 'coffee', 'shopping-bag', 'gift', 'graduation-cap', 'gym'] },
    { id: 'svg_work', label: 'Work', icons: ['briefcase', 'chart', 'credit-card', 'calculator', 'mail', 'calendar', 'printer', 'wrench'] },
    { id: 'svg_health', label: 'Health', icons: ['medical-cross', 'pill', 'tooth', 'eye', 'apple-nutrition', 'running', 'yoga', 'bicycle'] },
];

const COLORS = [
    '#FF3B30', '#F5C542', '#4ECB71', '#3693F5', '#5B8DEF',
    '#B07FE0', '#E84393', '#FD7E14', '#24292e', '#8E8E93',
];

interface Props {
    visible: boolean;
    icon: string;
    color: string;
    name?: string;
    onChange: (icon: string, color: string) => void;
    onClose: () => void;
}

export default function AppearanceModal({ visible, icon, color, name, onChange, onClose }: Props) {
    const [mode, setMode] = useState<'emoji' | 'icons'>(icon.startsWith('svg:') ? 'icons' : 'emoji');
    const [activeTab, setActiveTab] = useState(mode === 'icons' ? 'svg_utilities' : 'entertainment');
    const [selIcon, setSelIcon] = useState(icon);
    const [selColor, setSelColor] = useState(color);

    const tabs = mode === 'emoji' ? ICON_TABS : SVG_ICON_TABS;
    const activeIcons = tabs.find(t => t.id === activeTab)?.icons ?? [];

    const switchMode = (m: 'emoji' | 'icons') => {
        setMode(m);
        setActiveTab(m === 'emoji' ? ICON_TABS[0].id : SVG_ICON_TABS[0].id);
    };

    const handleDone = () => {
        onChange(selIcon, selColor);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                <View style={s.sheet}>
                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Appearance</Text>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
                            <Text style={s.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Preview */}
                    <View style={s.preview}>
                        <View style={[s.iconPreview, { backgroundColor: selColor }]}>
                            {selIcon.startsWith('svg:')
                              ? <BrandLogo name={selIcon.slice(4)} size={20} color="#FFFFFF" />
                              : <Text style={{ fontSize: 20 }}>{selIcon}</Text>}
                        </View>
                        <View>
                            <Text style={s.previewName}>{name || 'Subscription'}</Text>
                            <Text style={s.previewSub}>Preview</Text>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Mode toggle */}
                        <View style={s.modeRow}>
                            <TouchableOpacity
                                style={[s.modeBtn, mode === 'emoji' && { backgroundColor: selColor }]}
                                onPress={() => switchMode('emoji')}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.modeTxt, mode === 'emoji' && { color: '#fff' }]}>Emoji</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modeBtn, mode === 'icons' && { backgroundColor: selColor }]}
                                onPress={() => switchMode('icons')}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.modeTxt, mode === 'icons' && { color: '#fff' }]}>Icons</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row' }}>
                                {tabs.map(t => (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => setActiveTab(t.id)}
                                        style={[s.tabBtn, activeTab === t.id && { borderBottomWidth: 2, borderBottomColor: selColor }]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[s.tabLabel, { color: activeTab === t.id ? C.t1 : C.t3 }]}>{t.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Icons grid */}
                        <View style={s.grid}>
                            {mode === 'emoji'
                                ? activeIcons.map(ic => {
                                    const sel = selIcon === ic;
                                    return (
                                        <TouchableOpacity
                                            key={ic}
                                            style={[s.iconCell, { backgroundColor: sel ? selColor : C.bgSub }]}
                                            onPress={() => setSelIcon(ic)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={{ fontSize: 22 }}>{ic}</Text>
                                        </TouchableOpacity>
                                    );
                                })
                                : activeIcons.map(ic => {
                                    const svgKey = `svg:${ic}-fill`;
                                    const sel = selIcon === svgKey;
                                    return (
                                        <TouchableOpacity
                                            key={ic}
                                            style={[s.iconCell, { backgroundColor: sel ? selColor : C.bgSub }]}
                                            onPress={() => setSelIcon(svgKey)}
                                            activeOpacity={0.75}
                                        >
                                            <BrandLogo name={`${ic}-fill`} size={22} color={sel ? '#FFFFFF' : C.t2} />
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </View>

                        {/* Color swatches */}
                        <Text style={[s.sectionLabel, { marginTop: SP[3] }]}>Color</Text>
                        <View style={s.colorGrid}>
                            {COLORS.map(c => {
                                const sel = selColor === c;
                                return (
                                    <TouchableOpacity
                                        key={c}
                                        style={[s.swatch, { backgroundColor: c, borderWidth: sel ? 3 : 0, borderColor: '#fff', transform: [{ scale: sel ? 1.1 : 1 }] }]}
                                        onPress={() => setSelColor(c)}
                                        activeOpacity={0.8}
                                    />
                                );
                            })}
                        </View>

                        <View style={{ height: SP[5] }} />
                    </ScrollView>

                    {/* Done */}
                    <TouchableOpacity style={s.doneBtn} onPress={handleDone} activeOpacity={0.85}>
                        <Text style={s.doneTxt}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: C.bg,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: 20, paddingHorizontal: SP[4], paddingBottom: 16,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    title: {
        fontSize: 18, fontWeight: '700', color: C.t1,
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgSub,
        alignItems: 'center', justifyContent: 'center',
    },
    closeTxt: {
        fontSize: 12, color: C.t2,
    },
    preview: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: C.bgSub, borderRadius: R.md, padding: 12, marginBottom: 16,
    },
    iconPreview: {
        width: 48, height: 48, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center',
    },
    previewName: {
        fontSize: 14, fontWeight: '600', color: C.t1,
    },
    previewSub: {
        fontSize: 12, color: C.t3, marginTop: 2,
    },
    modeRow: {
        flexDirection: 'row', gap: 8, marginBottom: 12,
    },
    modeBtn: {
        paddingHorizontal: 16, paddingVertical: 6, borderRadius: R.pill,
        backgroundColor: C.bgSub,
    },
    modeTxt: {
        fontSize: 12, fontWeight: '600', color: C.t2,
    },
    sectionLabel: {
        fontSize: 11, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 8,
    },
    tabBtn: {
        paddingHorizontal: 12, paddingVertical: 8,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabLabel: {
        fontSize: 12, fontWeight: '600',
    },
    grid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    iconCell: {
        width: '18%', aspectRatio: 1, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center',
    },
    colorGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    },
    swatch: {
        width: 44, height: 44, borderRadius: 22,
    },
    doneBtn: {
        backgroundColor: C.black, borderRadius: R.pill,
        paddingVertical: 15, alignItems: 'center', marginTop: 12,
    },
    doneTxt: {
        fontSize: 16, fontWeight: '700', color: '#fff',
    },
});
