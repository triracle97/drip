import { getCurrency } from '@/constants/currencies';
import { useSettings } from '@/store/settings';
import type { Income, Sub } from '@/store';
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

// ─── LOCAL DATE HELPERS ───────────────────
// Dates are stored as 'YYYY-MM-DD' and always mean a LOCAL calendar day.
// Never use `new Date('YYYY-MM-DD')` (parsed as UTC) or `toISOString()`
// (formats in UTC) for them — both are off by one day outside UTC.

/** Local 'YYYY-MM-DD' for a Date. */
export const toLocalISO = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Parse 'YYYY-MM-DD' (optionally with a time part) as a LOCAL date at midnight. */
export const parseLocalDate = (iso?: string | null): Date | null => {
    if (!iso) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
};

export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Whole calendar days from a to b (DST-safe). */
export const daysBetween = (a: Date, b: Date): number =>
    Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);

// ─── NEXT CHARGE CALCULATION ──────────────
const daysIn = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

/** Billing interval of a sub: either N days or N months. */
export const cycleInterval = (s: Sub): { days: number } | { months: number } => {
    switch (s.cycle) {
        case 'weekly': return { days: 7 };
        case 'biweekly': return { days: 14 };
        case 'monthly': return { months: 1 };
        case 'quarterly': return { months: 3 };
        case 'biannual': return { months: 6 };
        case 'yearly': return { months: 12 };
        case 'custom': {
            const n = Math.max(1, Math.round(s.customNum || 1));
            if (s.customUnit === 'weeks') return { days: n * 7 };
            if (s.customUnit === 'years') return { months: n * 12 };
            return { months: n };
        }
        default: return { months: 1 };
    }
};

/** Date `months` after (year, month) on `day`, clamped to the month length (Jan 31 + 1mo = Feb 28/29). */
const monthDate = (year: number, month: number, months: number, day: number): Date => {
    const total = year * 12 + month + months;
    const y = Math.floor(total / 12);
    const m = total - y * 12;
    return new Date(y, m, Math.min(day, daysIn(m, y)));
};

/**
 * Date of the next charge (today counts) for a subscription.
 * - Pending trials charge first on the trial end date.
 * - Otherwise charges recur from `startDate` (anchor) every cycle interval.
 *   Subs without a startDate fall back to `billDay` of the current month.
 */
export const nextChargeDate = (s: Sub, now: Date = new Date()): Date => {
    const today = startOfDay(now);

    if (s.isTrial && s.trialDecision !== 'kept') {
        const trialEnd = parseLocalDate(s.trialEndDay);
        if (trialEnd && trialEnd >= today) return trialEnd;
    }

    const interval = cycleInterval(s);
    const start = parseLocalDate(s.startDate);
    const billDay = start ? start.getDate() : Math.min(Math.max(1, s.billDay || 1), 31);
    const anchor = start ?? monthDate(today.getFullYear(), today.getMonth(), 0, billDay);

    if (anchor >= today) {
        // Not started yet. Legacy subs without a start date have no real anchor, so the
        // first upcoming bill day this month is the next charge.
        return anchor;
    }

    if ('days' in interval) {
        const diff = daysBetween(anchor, today);
        const k = Math.ceil(diff / interval.days);
        const next = new Date(anchor);
        next.setDate(anchor.getDate() + k * interval.days);
        return next;
    }

    const step = interval.months;
    const monthsDiff = (today.getFullYear() - anchor.getFullYear()) * 12 + (today.getMonth() - anchor.getMonth());
    let k = Math.max(0, Math.floor(monthsDiff / step));
    let next = monthDate(anchor.getFullYear(), anchor.getMonth(), k * step, billDay);
    while (next < today) {
        k += 1;
        next = monthDate(anchor.getFullYear(), anchor.getMonth(), k * step, billDay);
    }
    return next;
};

/** Days until the next charge; 0 = charges today. */
export const nextChargeIn = (s: Sub, now: Date = new Date()): number =>
    Math.max(0, daysBetween(now, nextChargeDate(s, now)));

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
    if (mm === 60) return `${hh + 1}${i18n.t('time.h')}`;
    return mm > 0
        ? `${hh}${i18n.t('time.h')} ${String(mm).padStart(2, '0')}${i18n.t('time.m')}`
        : `${hh}${i18n.t('time.h')}`;
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

const safeParse = (m: string | null | undefined): Record<string, any> => {
    if (!m) return {};
    try {
        const v = JSON.parse(m);
        return v && typeof v === 'object' ? v : {};
    } catch {
        return {};
    }
};

/** Calculate total lifetime cost from event log for a single subscription */
export function lifetimeCost(events: SubscriptionEvent[], currentCost: number, currentCycle: string, customNum?: number, customUnit?: string): number {
    if (events.length === 0) return 0;

    const MONTH_MS = 1000 * 60 * 60 * 24 * 30.44;
    const mo = (cost: number, cycle: string) =>
        moEq(cost, cycle, cycle === 'custom' ? customNum : undefined, cycle === 'custom' ? customUnit : undefined);

    let total = 0;
    let activeSince: number | null = null;
    let monthlyCost = mo(currentCost, currentCycle);

    for (const evt of events) {
        const meta = safeParse(evt.metadata);
        if (evt.type === 'added') {
            activeSince = evt.timestamp;
            monthlyCost = typeof meta.cost === 'number'
                ? mo(meta.cost, meta.cycle ?? currentCycle)
                : mo(currentCost, currentCycle);
        } else if (evt.type === 'price_change' && activeSince != null) {
            total += ((evt.timestamp - activeSince) / MONTH_MS) * monthlyCost;
            activeSince = evt.timestamp;
            if (typeof meta.newCost === 'number') monthlyCost = mo(meta.newCost, meta.cycle ?? currentCycle);
        } else if (evt.type === 'cycle_change' && activeSince != null) {
            total += ((evt.timestamp - activeSince) / MONTH_MS) * monthlyCost;
            activeSince = evt.timestamp;
            monthlyCost = mo(typeof meta.cost === 'number' ? meta.cost : currentCost, meta.newCycle ?? currentCycle);
        } else if (evt.type === 'cancelled' && activeSince != null) {
            total += ((evt.timestamp - activeSince) / MONTH_MS) * monthlyCost;
            activeSince = null;
        } else if (evt.type === 'reactivated') {
            activeSince = evt.timestamp;
        }
    }

    if (activeSince != null) {
        total += ((Date.now() - activeSince) / MONTH_MS) * monthlyCost;
    }

    return Math.max(0, total);
}

// ─── DATE HELPERS ─────────────────────────
export const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
export const dayName = (d: number, m: number, y: number) =>
    new Date(y, m, d).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
export const monthName = (m: number, y: number) =>
    new Date(y, m).toLocaleDateString('en', { month: 'long', year: 'numeric' });

/** Short localized date, e.g. "Dec 3". */
export const shortDate = (d: Date): string => {
    try {
        return d.toLocaleDateString(i18n.language || 'en', { month: 'short', day: 'numeric' });
    } catch {
        return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }
};

/** Return a local ISO date string (YYYY-MM-DD) that is `days` days from today. */
export const addDaysISO = (days: number, now: Date = new Date()): string => {
    const d = startOfDay(now);
    d.setDate(d.getDate() + days);
    return toLocalISO(d);
};

/** Compute the number of days remaining until the trial-end ISO date string.
 *  Returns 0 if the date is in the past or the value is empty / falsy. */
export const trialDaysLeft = (trialEndDay: string, now: Date = new Date()): number => {
    const end = parseLocalDate(trialEndDay);
    if (!end) return 0;
    return Math.max(0, daysBetween(now, end));
};

/** How many days ago the trial ended. Returns 0 if still active, Infinity if no date. */
export const daysSinceTrialEnd = (trialEndDay: string, now: Date = new Date()): number => {
    const end = parseLocalDate(trialEndDay);
    if (!end) return Infinity;
    return Math.max(0, daysBetween(end, now));
};
