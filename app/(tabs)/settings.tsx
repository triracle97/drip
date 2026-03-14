import Card from '@/components/Card';
import CategoryManager from '@/components/CategoryManager';
import CurrencySheet from '@/components/CurrencySheet';
import IncomeSheet from '@/components/IncomeSheet';
import LanguageSheet from '@/components/LanguageSheet';
import Toast from '@/components/Toast';
import { getCurrency } from '@/constants/currencies';
import { C, LAYOUT, R, SP } from '@/constants/design';
import { LANGUAGE_OPTIONS } from '@/i18n';
import { useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { blended, fmt, monthlyIncome, subMo, toHrs } from '@/utils/calc';
import { requestPermissions, rescheduleAllNotifications } from '@/utils/notifications';
import { useTranslation } from 'react-i18next';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { incomes, subs, categories } = useStore();
    const { currency, language, notificationsEnabled, notificationTime, setNotificationsEnabled, setNotificationTime } = useSettings();
    const incomeRef = useRef<TrueSheet>(null);
    const [showCategories, setShowCategories] = useState(false);
    const [showCurrency, setShowCurrency] = useState(false);
    const [showLanguage, setShowLanguage] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const { t } = useTranslation();
    const [toast, setToast] = useState<string | null>(null);
    const currencyInfo = getCurrency(currency);
    const languageLabel = LANGUAGE_OPTIONS.find(o => o.code === language)?.label ?? 'English';
    const rate = blended(incomes);
    const moIncome = monthlyIncome(incomes);
    const totalMo = subs.filter(s => s.active && !s.isTrial).reduce((sum, s) => sum + subMo(s), 0);

    const handleToggleNotifications = async (enabled: boolean) => {
        if (enabled) {
            const granted = await requestPermissions();
            if (!granted) {
                setToast(t('settings.enableNotifications'));
                return;
            }
        }
        setNotificationsEnabled(enabled);
        rescheduleAllNotifications(subs, enabled, notificationTime);
    };

    const handleTimeChange = (_: any, date?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (!date) return;
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const time = `${hh}:${mm}`;
        setNotificationTime(time);
        rescheduleAllNotifications(subs, notificationsEnabled, time);
    };

    const timeDate = (() => {
        const [h, m] = notificationTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    })();

    const formatTime12h = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const SettingsRow = ({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) => (
        <TouchableOpacity onPress={onPress} style={s.row} activeOpacity={0.75}>
            <Text style={s.rowLabel}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.rowHint}>{hint}</Text>
                <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                    <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Text style={s.title}>{t('settings.title')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 32 }}
                showsVerticalScrollIndicator={false}
            >
                <Card key={`summary-${currency}`} style={s.summaryCard}>
                    <Text style={s.summaryLabel}>{t('settings.totalMonthlyCost')}</Text>
                    <Text style={s.summaryValue}>{fmt(totalMo)}</Text>
                    <Text style={s.summarySub}>= {toHrs(totalMo, rate)} of work at {fmt(rate)}/hr blended</Text>
                </Card>

                <Text style={s.sectionCap}>{t('settings.incomeRate')}</Text>
                <View key={`income-${currency}`} style={s.incomeCard}>
                    <View style={s.incomeTop}>
                        <View style={s.incomeIcon}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                                <Path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" stroke={C.green} strokeWidth={1.8} />
                                <Path d="M12 9v6M9 12h6" stroke={C.green} strokeWidth={1.8} strokeLinecap="round" />
                            </Svg>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.incomeTitle}>{t('settings.monthlyIncome')}</Text>
                            <Text style={s.incomeSubtitle}>{t('settings.baselineInsights')}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={s.incomeAmount}>{fmt(moIncome)}</Text>
                            <Text style={s.incomeRate}>{fmt(rate)}/hr</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => incomeRef.current?.present()} style={s.incomeBtn} activeOpacity={0.8}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                            <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                            <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={s.incomeBtnText}>{t('settings.updateIncome')}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[s.sectionCap, { marginTop: 24 }]}>{t('settings.data')}</Text>
                <SettingsRow label={t('settings.manageCategories')} hint={t('settings.categoriesCount', { count: categories.length })} onPress={() => setShowCategories(true)} />

                <Text style={[s.sectionCap, { marginTop: 24 }]}>{t('settings.general')}</Text>
                <SettingsRow label={t('settings.appearance')} hint={t('settings.light')} onPress={() => { }} />
                <SettingsRow label={t('settings.currency')} hint={`${currencyInfo.symbol} ${currency}`} onPress={() => setShowCurrency(true)} />
                <SettingsRow label={t('settings.language')} hint={languageLabel} onPress={() => setShowLanguage(true)} />

                <TouchableOpacity onPress={() => handleToggleNotifications(!notificationsEnabled)} style={s.row} activeOpacity={0.75}>
                    <Text style={s.rowLabel}>{t('settings.notifications')}</Text>
                    <View style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: 'rgba(0,0,0,0.16)', true: C.black }}
                            thumbColor="#fff"
                        />
                    </View>
                </TouchableOpacity>
                {notificationsEnabled && (
                    <TouchableOpacity onPress={() => setShowTimePicker(!showTimePicker)} style={s.row} activeOpacity={0.75}>
                        <Text style={s.rowLabel}>{t('settings.notificationTime')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={s.rowHint}>{formatTime12h(notificationTime)}</Text>
                            <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                                <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                        </View>
                    </TouchableOpacity>
                )}
                {notificationsEnabled && showTimePicker && (
                    <DateTimePicker
                        value={timeDate}
                        mode="time"
                        display="spinner"
                        onChange={handleTimeChange}
                    />
                )}

                <Text style={s.version}>{t('settings.version')}</Text>
            </ScrollView>

            <IncomeSheet ref={incomeRef} />
            <CategoryManager visible={showCategories} onClose={() => setShowCategories(false)} />
            <CurrencySheet visible={showCurrency} onClose={() => setShowCurrency(false)} />
            <LanguageSheet visible={showLanguage} onClose={() => setShowLanguage(false)} />
            <Toast message={toast} />
        </View>
    );
}

const s = StyleSheet.create({
    header: {
        paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 16, backgroundColor: C.bg,
    },
    title: {
        fontSize: 22, fontWeight: '700', color: C.t1,
    },
    summaryCard: {
        marginBottom: SP[4],
    },
    summaryLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 4,
    },
    summaryValue: {
        fontSize: 32, fontWeight: '700', color: C.t1,
    },
    summarySub: {
        fontSize: 12, color: C.t2, marginTop: 4,
    },
    sectionCap: {
        fontSize: 11, fontWeight: '500', color: C.t3, letterSpacing: 0.5, marginBottom: 12,
    },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: C.line,
    },
    rowLabel: {
        fontSize: 14, color: C.t1, fontWeight: '500',
    },
    rowHint: {
        fontSize: 13, color: C.t3,
    },
    incomeCard: {
        backgroundColor: C.surfaceElevated,
        borderRadius: R.md,
        padding: 16,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    incomeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    incomeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.greenBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    incomeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: C.t1,
    },
    incomeSubtitle: {
        fontSize: 12,
        color: C.t3,
        marginTop: 2,
    },
    incomeAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: C.t1,
    },
    incomeRate: {
        fontSize: 12,
        color: C.t3,
        marginTop: 2,
    },
    incomeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.black,
        borderRadius: R.md,
        paddingVertical: 13,
    },
    incomeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    version: {
        fontSize: 11, color: C.t3, textAlign: 'center', marginTop: 40,
    },
});
