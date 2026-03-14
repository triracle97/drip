import { C, R, SP } from '@/constants/design';
import { CURRENCIES, getCurrency } from '@/constants/currencies';
import { useSettings } from '@/store/settings';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function CurrencySheet({ visible, onClose }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { currency, setCurrency: setCurrencyCode } = useSettings();
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? CURRENCIES.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.includes(search)
        )
        : CURRENCIES;

    const handleSelect = (code: string) => {
        setCurrencyCode(code);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[s.container, { paddingTop: insets.top + 8 }]}>
                <View style={s.header}>
                    <Text style={s.title}>{t('currencySheet.title')}</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={16}>
                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                            <Path d="M18 6L6 18M6 6l12 12" stroke={C.t1} strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                <View style={s.searchWrap}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                        <Path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke={C.t3} strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                    <TextInput
                        style={s.searchInput}
                        placeholder={t('currencySheet.search')}
                        placeholderTextColor={C.t3}
                        value={search}
                        onChangeText={setSearch}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={item => item.code}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                        const selected = item.code === currency;
                        return (
                            <TouchableOpacity
                                style={[s.row, selected && s.rowSelected]}
                                onPress={() => handleSelect(item.code)}
                                activeOpacity={0.7}
                            >
                                <View style={s.symbolWrap}>
                                    <Text style={s.symbol}>{item.symbol}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.name}>{item.name}</Text>
                                    <Text style={s.code}>{item.code}</Text>
                                </View>
                                {selected && (
                                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                                        <Path d="M20 6L9 17l-5-5" stroke={C.black} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                    </Svg>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SP[4],
        paddingBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: C.t1,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surfaceElevated,
        borderRadius: R.md,
        marginHorizontal: SP[4],
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: C.t1,
        padding: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SP[4],
        paddingVertical: 12,
        gap: 12,
    },
    rowSelected: {
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    symbolWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    symbol: {
        fontSize: 16,
        fontWeight: '600',
        color: C.t1,
    },
    name: {
        fontSize: 15,
        fontWeight: '500',
        color: C.t1,
    },
    code: {
        fontSize: 12,
        color: C.t3,
        marginTop: 2,
    },
});
