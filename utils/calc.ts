import { getCurrency } from '@/constants/currencies';
import { useSettings } from '@/store/settings';
import { Income, Sub } from '@/store';
import type { SubscriptionEvent } from '@/store/repository';
import i18n from '@/i18n';

// ─── FORMATTERS ───────────────────────────
export const fmt = (n: number) => {
    const c = getCurrency(useSettings.getState().currency);
    const abs = Math.abs(n);
    const fixed = abs.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, c.thousandSeparator);
    const formatted = grouped + c.decimalSeparator + decPart;
    const sign = n < 0 ? '-' : '';
    return c.symbolPosition === 'before'
        ? sign + c.symbol + formatted
        : sign + formatted + c.symbol;
};

// ─── CYCLE TO MONTHLY EQUIVALENT ──────────
export const moEq = (cost: number, cyc: string, cNum?: number, cUnit?: string): number => {
    if (cyc === 'custom' && cNum && cUnit) {
        const mo = cUnit === 'weeks' ? cNum / 4.33 : cUnit === 'months' ? cNum : cNum * 12;
        return cost / mo;
    }
    return (
        ({ weekly: cost * 4.33, biweekly: cost * 2.17, monthly: cost, quarterly: cost / 3, biannual: cost / 6, yearly: cost / 12 } as Record<string, number>)[cyc] ?? cost
    );
};

export const subMo = (s: Sub): number => moEq(s.cost, s.cycle, s.customNum, s.customUnit);

export const cycleLabel = (s: Sub): string => {
    if (s.cycle === 'custom' && s.customNum && s.customUnit)
        return i18n.t('cycle.custom', { num: s.customNum, unit: s.customUnit });
    const map: Record<string, string> = {
        weekly: i18n.t('cycle.weekly'),
        biweekly: i18n.t('cycle.biweekly'),
        monthly: i18n.t('cycle.monthly'),
        quarterly: i18n.t('cycle.quarterly'),
        biannual: i18n.t('cycle.biannual'),
        yearly: i18n.t('cycle.yearly'),
    };
    return map[s.cycle] ?? s.cycle;
};

// ─── NEXT CHARGE CALCULATION ──────────────
const daysIn = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

export const nextChargeIn = (s: Sub): number => {
    const now = new Date();
    const bd = s.billDay || 1;
    let moInterval = 1;
    if (s.cycle === 'weekly') moInterval = 0.25;
    else if (s.cycle === 'biweekly') moInterval = 0.5;
    else if (s.cycle === 'monthly') moInterval = 1;
    else if (s.cycle === 'quarterly') moInterval = 3;
    else if (s.cycle === 'biannual') moInterval = 6;
    else if (s.cycle === 'yearly') moInterval = 12;
    else if (s.cycle === 'custom' && s.customNum && s.customUnit) {
        moInterval =
            s.customUnit === 'weeks' ? s.customNum * 0.25 :
                s.customUnit === 'years' ? s.customNum * 12 :
                    s.customNum;
    }

    if (moInterval < 1) {
        const dayInterval = Math.round(moInterval * 30);
        const startDate = s.startDate ? new Date(s.startDate) : new Date(now.getFullYear(), now.getMonth(), bd);
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
        const remaining = dayInterval - (diffDays % dayInterval);
        return remaining === dayInterval ? dayInterval : remaining;
    }

    let nextMonth = now.getMonth();
    let nextYear = now.getFullYear();
    let nextDate = new Date(nextYear, nextMonth, Math.min(bd, daysIn(nextMonth, nextYear)));
    if (nextDate <= now) {
        nextMonth += Math.max(1, Math.round(moInterval));
        if (nextMonth > 11) { nextYear += Math.floor(nextMonth / 12); nextMonth = nextMonth % 12; }
        nextDate = new Date(nextYear, nextMonth, Math.min(bd, daysIn(nextMonth, nextYear)));
    }
    return Math.max(1, Math.ceil((nextDate.getTime() - now.getTime()) / 86400000));
};

export const cycleDays = (s: Sub): number => {
    if (s.cycle === 'weekly') return 7;
    if (s.cycle === 'biweekly') return 14;
    if (s.cycle === 'monthly') return 30;
    if (s.cycle === 'quarterly') return 90;
    if (s.cycle === 'biannual') return 180;
    if (s.cycle === 'yearly') return 365;
    if (s.cycle === 'custom' && s.customNum && s.customUnit) {
        if (s.customUnit === 'weeks') return s.customNum * 7;
        if (s.customUnit === 'months') return s.customNum * 30;
        if (s.customUnit === 'years') return s.customNum * 365;
    }
    return 30;
};

export const daysLabel = (d: number): string => {
    if (d <= 0) return i18n.t('time.today');
    if (d === 1) return i18n.t('time.dayLeft');
    if (d <= 30) return i18n.t('time.daysLeft', { count: d });
    if (d <= 365) {
        const m = Math.round(d / 30);
        return m === 1
            ? i18n.t('time.monthLeft', { count: m })
            : i18n.t('time.monthsLeft', { count: m });
    }
    return i18n.t('time.yearLeft', { count: Math.round(d / 365) });
};

// ─── INCOME + TIME COST ───────────────────
export const blended = (incs: Income[]): number => {
    let earn = 0, hrs = 0;
    incs.forEach(i => {
        if (i.isHourly) { earn += i.amount * (i.hoursPerWeek || 10); hrs += i.hoursPerWeek || 10; }
        else { earn += i.amount / 52; hrs += i.hoursPerWeek || 40; }
    });
    return hrs > 0 ? earn / hrs : 0;
};

export const toHrs = (mo: number, rate: number): string => {
    if (!rate) return '—';
    const h = mo / rate;
    if (h < 1) return `${Math.round(h * 60)}${i18n.t('time.min')}`;
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return mm > 0 ? `${hh}${i18n.t('time.h')} ${mm}${i18n.t('time.m')}` : `${hh}${i18n.t('time.h')}`;
};

export const timeTier = (cost: number, rate: number): { color: string; label: string; bg: string } => {
    if (!rate) return { color: '#6B6B6B', label: '', bg: '#F5F5F5' };
    const h = cost / rate;
    if (h >= 16) return { color: '#FF3B30', label: i18n.t('tier.extreme'), bg: 'rgba(255,59,48,0.08)' };
    if (h >= 8) return { color: '#FF3B30', label: i18n.t('tier.veryHigh'), bg: 'rgba(255,59,48,0.08)' };
    if (h >= 4) return { color: '#F5A623', label: i18n.t('tier.high'), bg: 'rgba(245,166,35,0.08)' };
    if (h >= 1) return { color: '#000000', label: i18n.t('tier.moderate'), bg: 'rgba(79,172,207,0.08)' };
    if (h >= 0.25) return { color: '#00C805', label: i18n.t('tier.low'), bg: 'rgba(0,200,5,0.08)' };
    return { color: '#ABABAB', label: i18n.t('tier.minimal'), bg: '#F5F5F5' };
};

// ─── BUDGET HEALTH ───────────────────────
export const monthlyIncome = (incs: Income[]): number => {
    return incs.reduce((sum, i) => {
        return sum + (i.isHourly ? i.amount * (i.hoursPerWeek || 10) * 4.33 : i.amount / 12);
    }, 0);
};

export const budgetHealth = (monthlySubCost: number, moIncome: number): { level: string; label: string; color: string; pct: number } => {
    if (moIncome <= 0) return { level: 'unknown', label: i18n.t('budget.setIncome'), color: '#8E8E93', pct: 0 };
    const pct = (monthlySubCost / moIncome) * 100;
    if (pct < 5) return { level: 'healthy', label: i18n.t('budget.healthy'), color: '#00C805', pct };
    if (pct < 10) return { level: 'moderate', label: i18n.t('budget.moderate'), color: '#F5A623', pct };
    if (pct < 15) return { level: 'high', label: i18n.t('budget.high'), color: '#FF6B35', pct };
    return { level: 'alert', label: i18n.t('budget.alert'), color: '#FF3B30', pct };
};

// ─── LIFETIME COST ───────────────────────

/** Calculate total lifetime cost from event log for a single subscription */
export function lifetimeCost(events: SubscriptionEvent[], currentCost: number, currentCycle: string, customNum?: number, customUnit?: string): number {
    if (events.length === 0) return 0;

    let total = 0;
    let activeSince: number | null = null;
    let monthlyCost = 0;

    for (const evt of events) {
        if (evt.type === 'added') {
            activeSince = evt.timestamp;
            const meta = evt.metadata ? JSON.parse(evt.metadata) : null;
            monthlyCost = meta?.cost != null ? moEq(meta.cost, meta.cycle) : moEq(currentCost, currentCycle, customNum, customUnit);
        } else if (evt.type === 'price_change' && activeSince != null) {
            const months = (evt.timestamp - activeSince) / (1000 * 60 * 60 * 24 * 30.44);
            total += months * monthlyCost;
            activeSince = evt.timestamp;
            const meta = JSON.parse(evt.metadata!);
            monthlyCost = moEq(meta.newCost, meta.cycle ?? currentCycle, customNum, customUnit);
        } else if ((evt.type === 'cycle_change') && activeSince != null) {
            const months = (evt.timestamp - activeSince) / (1000 * 60 * 60 * 24 * 30.44);
            total += months * monthlyCost;
            activeSince = evt.timestamp;
            const meta = JSON.parse(evt.metadata!);
            monthlyCost = moEq(meta.cost ?? currentCost, meta.newCycle, customNum, customUnit);
        } else if (evt.type === 'cancelled' && activeSince != null) {
            const months = (evt.timestamp - activeSince) / (1000 * 60 * 60 * 24 * 30.44);
            total += months * monthlyCost;
            activeSince = null;
        } else if (evt.type === 'reactivated') {
            activeSince = evt.timestamp;
        }
    }

    if (activeSince != null) {
        const months = (Date.now() - activeSince) / (1000 * 60 * 60 * 24 * 30.44);
        total += months * monthlyCost;
    }

    return total;
}

// ─── DATE HELPERS ─────────────────────────
export const today = new Date();
export const curDay = today.getDate();
export const curMonth = today.getMonth();
export const curYear = today.getFullYear();
export const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
export const dayName = (d: number, m: number, y: number) =>
    new Date(y, m, d).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
export const monthName = (m: number, y: number) =>
    new Date(y, m).toLocaleDateString('en', { month: 'long', year: 'numeric' });

/** Return an ISO date string (YYYY-MM-DD) that is `days` days from today. */
export const addDaysISO = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

/** Compute the number of days remaining until the trial-end ISO date string.
 *  Returns 0 if the date is in the past or the value is empty / falsy. */
export const trialDaysLeft = (trialEndDay: string): number => {
    if (!trialEndDay) return 0;
    const end = new Date(trialEndDay + 'T00:00:00');
    if (isNaN(end.getTime())) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
};

/** How many days ago the trial ended. Returns 0 if still active, Infinity if no date. */
export const daysSinceTrialEnd = (trialEndDay: string): number => {
    if (!trialEndDay) return Infinity;
    const end = new Date(trialEndDay + 'T00:00:00');
    if (isNaN(end.getTime())) return Infinity;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - end.getTime()) / 86400000);
    return Math.max(0, diff);
};
