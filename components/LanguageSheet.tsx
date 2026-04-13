import { C, R, SP } from '@/constants/design';
import { LANGUAGE_OPTIONS, resolveLanguage } from '@/i18n';
import i18n from '@/i18n';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { useSettings } from '@/store/settings';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function LanguageSheet({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { language, setLanguage } = useSettings();
    const { t } = useTranslation();

    const handleSelect = (code: string) => {
        track(AnalyticsEvents.LANGUAGE_CHANGED, { from: language, to: code });
        setLanguage(code);
        i18n.changeLanguage(resolveLanguage(code));
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[s.container, { paddingTop: insets.top + 8 }]}>
                <View style={s.header}>
                    <Text style={s.title}>{t('language.title')}</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={16}>
                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                            <Path d="M18 6L6 18M6 6l12 12" stroke={C.t1} strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                {LANGUAGE_OPTIONS.map(opt => {
                    const selected = opt.code === language;
                    return (
                        <TouchableOpacity
                            key={opt.code}
                            style={[s.row, selected && s.rowSelected]}
                            onPress={() => handleSelect(opt.code)}
                            activeOpacity={0.7}
                        >
                            <Text style={s.label}>{opt.label}</Text>
                            {selected && (
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                                    <Path d="M20 6L9 17l-5-5" stroke={C.black} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SP[4], paddingBottom: 16,
    },
    title: { fontSize: 20, fontWeight: '700', color: C.t1 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SP[4], paddingVertical: 14,
    },
    rowSelected: { backgroundColor: 'rgba(0,0,0,0.04)' },
    label: { fontSize: 16, fontWeight: '500', color: C.t1 },
});
