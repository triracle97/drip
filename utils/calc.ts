import { Income, Sub } from '@/store';

// ─── FORMATTERS ───────────────────────────
export const fmt = (n: number) =>
    '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
        return `every ${s.customNum} ${s.customUnit}`;
    return (
        ({ weekly: 'weekly', biweekly: 'biweekly', monthly: 'monthly', quarterly: 'quarterly', biannual: 'every 6mo', yearly: 'yearly' } as Record<string, string>)[s.cycle] ?? s.cycle
    );
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
    if (d <= 0) return 'Today';
    if (d === 1) return '1 day left';
    if (d <= 30) return `${d} days left`;
    if (d <= 365) { const m = Math.round(d / 30); return `${m} month${m > 1 ? 's' : ''} left`; }
    return `${Math.round(d / 365)} year left`;
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
    if (h < 1) return `${Math.round(h * 60)}min`;
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
};

export const timeTier = (cost: number, rate: number): { color: string; label: string; bg: string } => {
    if (!rate) return { color: '#6B6B6B', label: '', bg: '#F5F5F5' };
    const h = cost / rate;
    if (h >= 16) return { color: '#FF3B30', label: 'Extreme', bg: 'rgba(255,59,48,0.08)' };
    if (h >= 8) return { color: '#FF3B30', label: 'Very High', bg: 'rgba(255,59,48,0.08)' };
    if (h >= 4) return { color: '#F5A623', label: 'High', bg: 'rgba(245,166,35,0.08)' };
    if (h >= 1) return { color: '#000000', label: 'Moderate', bg: 'rgba(79,172,207,0.08)' };
    if (h >= 0.25) return { color: '#00C805', label: 'Low', bg: 'rgba(0,200,5,0.08)' };
    return { color: '#ABABAB', label: 'Minimal', bg: '#F5F5F5' };
};

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
