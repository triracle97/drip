import type { Sub } from '@/store';
import {
  addDaysISO,
  daysBetween,
  daysSinceTrialEnd,
  lifetimeCost,
  moEq,
  nextChargeDate,
  nextChargeIn,
  parseLocalDate,
  toLocalISO,
  trialDaysLeft,
} from '@/utils/calc';

const d = (y: number, m: number, day: number, h = 10) => new Date(y, m - 1, day, h, 0, 0);
const iso = (date: Date) => toLocalISO(date);

const sub = (over: Partial<Sub> = {}): Sub => ({
  id: 's1',
  name: 'Netflix',
  icon: '📺',
  cost: 15,
  cycle: 'monthly',
  categoryId: 'cat_entertainment',
  active: true,
  billDay: 1,
  startDate: undefined,
  isTrial: false,
  trialEndDay: '',
  trialDecision: 'none',
  color: '#000',
  reminderDays: null,
  sortOrder: 0,
  ...over,
});

describe('local date helpers', () => {
  it('parses YYYY-MM-DD as a local calendar day (not UTC)', () => {
    const p = parseLocalDate('2026-03-01')!;
    expect(p.getFullYear()).toBe(2026);
    expect(p.getMonth()).toBe(2);
    expect(p.getDate()).toBe(1);
    expect(p.getHours()).toBe(0);
  });

  it('round-trips through toLocalISO', () => {
    expect(toLocalISO(parseLocalDate('2026-12-31')!)).toBe('2026-12-31');
  });

  it('rejects garbage', () => {
    expect(parseLocalDate('')).toBeNull();
    expect(parseLocalDate(undefined)).toBeNull();
    expect(parseLocalDate('not a date')).toBeNull();
  });

  it('addDaysISO uses the local day even late at night', () => {
    expect(addDaysISO(3, new Date(2026, 10, 22, 23, 45))).toBe('2026-11-25');
    expect(addDaysISO(0, new Date(2026, 10, 22, 0, 5))).toBe('2026-11-22');
  });

  it('daysBetween counts calendar days', () => {
    expect(daysBetween(d(2026, 11, 22, 23), d(2026, 11, 23, 1))).toBe(1);
    expect(daysBetween(d(2026, 11, 22), d(2026, 11, 22, 23))).toBe(0);
  });
});

describe('nextChargeDate', () => {
  const now = d(2026, 11, 22);

  it('monthly: next occurrence of the start day', () => {
    expect(iso(nextChargeDate(sub({ startDate: '2026-01-15' }), now))).toBe('2026-12-15');
    expect(iso(nextChargeDate(sub({ startDate: '2026-01-25' }), now))).toBe('2026-11-25');
  });

  it('charge day itself counts as today (0 days)', () => {
    const s = sub({ startDate: '2026-01-22' });
    expect(iso(nextChargeDate(s, now))).toBe('2026-11-22');
    expect(nextChargeIn(s, now)).toBe(0);
  });

  it('clamps day 31 to short months without drifting', () => {
    const s = sub({ startDate: '2026-01-31' });
    expect(iso(nextChargeDate(s, d(2026, 2, 10)))).toBe('2026-02-28');
    expect(iso(nextChargeDate(s, d(2026, 3, 1)))).toBe('2026-03-31');
    expect(iso(nextChargeDate(s, d(2026, 4, 5)))).toBe('2026-04-30');
  });

  it('yearly uses the start month (regression: was anchored to current month)', () => {
    const s = sub({ cycle: 'yearly', startDate: '2025-03-15' });
    expect(iso(nextChargeDate(s, now))).toBe('2027-03-15');
    expect(iso(nextChargeDate(s, d(2026, 3, 1)))).toBe('2026-03-15');
  });

  it('quarterly / biannual step from the start month', () => {
    expect(iso(nextChargeDate(sub({ cycle: 'quarterly', startDate: '2026-01-10' }), now))).toBe('2027-01-10');
    expect(iso(nextChargeDate(sub({ cycle: 'quarterly', startDate: '2026-02-28' }), now))).toBe('2026-11-28');
    expect(iso(nextChargeDate(sub({ cycle: 'biannual', startDate: '2026-02-01' }), now))).toBe('2027-02-01');
  });

  it('weekly is every 7 days (regression: was every 8)', () => {
    const s = sub({ cycle: 'weekly', startDate: '2026-11-01' });
    expect(iso(nextChargeDate(s, d(2026, 11, 22)))).toBe('2026-11-22');
    expect(iso(nextChargeDate(s, d(2026, 11, 23)))).toBe('2026-11-29');
    expect(nextChargeIn(s, d(2026, 11, 23))).toBe(6);
  });

  it('biweekly is every 14 days', () => {
    const s = sub({ cycle: 'biweekly', startDate: '2026-11-01' });
    expect(iso(nextChargeDate(s, d(2026, 11, 16)))).toBe('2026-11-29');
  });

  it('custom cycles', () => {
    expect(iso(nextChargeDate(sub({ cycle: 'custom', customNum: 3, customUnit: 'weeks', startDate: '2026-11-01' }), now)))
      .toBe('2026-11-22');
    expect(iso(nextChargeDate(sub({ cycle: 'custom', customNum: 3, customUnit: 'weeks', startDate: '2026-11-01' }), d(2026, 11, 23))))
      .toBe('2026-12-13');
    expect(iso(nextChargeDate(sub({ cycle: 'custom', customNum: 2, customUnit: 'months', startDate: '2026-01-05' }), now)))
      .toBe('2027-01-05');
    expect(iso(nextChargeDate(sub({ cycle: 'custom', customNum: 1, customUnit: 'years', startDate: '2024-06-01' }), now)))
      .toBe('2027-06-01');
  });

  it('future start date is the first charge', () => {
    expect(iso(nextChargeDate(sub({ startDate: '2026-12-03' }), now))).toBe('2026-12-03');
    expect(nextChargeIn(sub({ cycle: 'weekly', startDate: '2026-11-25' }), now)).toBe(3);
  });

  it('pending trial charges first on the trial end date', () => {
    const s = sub({ isTrial: true, trialDecision: 'pending', trialEndDay: '2026-11-25', startDate: '2026-11-18' });
    expect(iso(nextChargeDate(s, now))).toBe('2026-11-25');
  });

  it('ended trial falls back to the regular cycle', () => {
    const s = sub({ isTrial: true, trialDecision: 'pending', trialEndDay: '2026-11-20', startDate: '2026-11-13' });
    expect(iso(nextChargeDate(s, now))).toBe('2026-12-13');
  });

  it('legacy subs without a start date use billDay', () => {
    expect(iso(nextChargeDate(sub({ billDay: 5 }), now))).toBe('2026-12-05');
    expect(iso(nextChargeDate(sub({ billDay: 28 }), now))).toBe('2026-11-28');
  });

  it('is stable across DST changes (US: 2026-03-08, 2026-11-01)', () => {
    const s = sub({ cycle: 'weekly', startDate: '2026-03-01' });
    expect(iso(nextChargeDate(s, d(2026, 3, 9)))).toBe('2026-03-15');
    expect(nextChargeIn(s, d(2026, 3, 9))).toBe(6);
    const s2 = sub({ cycle: 'weekly', startDate: '2026-10-25' });
    expect(iso(nextChargeDate(s2, d(2026, 11, 2)))).toBe('2026-11-08');
  });

  it('crosses year boundaries', () => {
    expect(iso(nextChargeDate(sub({ startDate: '2026-01-10' }), d(2026, 12, 20)))).toBe('2027-01-10');
  });
});

describe('trial helpers', () => {
  const now = d(2026, 11, 22, 21);
  it('trialDaysLeft', () => {
    expect(trialDaysLeft('2026-11-25', now)).toBe(3);
    expect(trialDaysLeft('2026-11-22', now)).toBe(0);
    expect(trialDaysLeft('2026-11-01', now)).toBe(0);
    expect(trialDaysLeft('', now)).toBe(0);
  });
  it('daysSinceTrialEnd', () => {
    expect(daysSinceTrialEnd('2026-11-20', now)).toBe(2);
    expect(daysSinceTrialEnd('2026-11-30', now)).toBe(0);
    expect(daysSinceTrialEnd('', now)).toBe(Infinity);
  });
});

describe('moEq', () => {
  it('normalizes to monthly', () => {
    expect(moEq(120, 'yearly')).toBe(10);
    expect(moEq(30, 'quarterly')).toBe(10);
    expect(moEq(10, 'monthly')).toBe(10);
    expect(moEq(12, 'custom', 2, 'months')).toBe(6);
    expect(moEq(24, 'custom', 2, 'years')).toBe(1);
  });
});

describe('lifetimeCost', () => {
  const MONTH = 1000 * 60 * 60 * 24 * 30.44;
  it('returns 0 without events', () => {
    expect(lifetimeCost([], 10, 'monthly')).toBe(0);
  });
  it('does not crash on null / malformed metadata', () => {
    const t0 = Date.now() - 2 * MONTH;
    expect(() =>
      lifetimeCost(
        [
          { id: 'a', subscriptionId: 's', subscriptionName: 'x', type: 'added', timestamp: t0, metadata: null },
          { id: 'b', subscriptionId: 's', subscriptionName: 'x', type: 'price_change', timestamp: t0 + MONTH, metadata: null },
          { id: 'c', subscriptionId: 's', subscriptionName: 'x', type: 'cycle_change', timestamp: t0 + MONTH, metadata: '{bad' },
        ],
        10,
        'monthly',
      ),
    ).not.toThrow();
  });
  it('accumulates across price changes and cancellation', () => {
    const t0 = Date.now() - 3 * MONTH;
    const total = lifetimeCost(
      [
        { id: 'a', subscriptionId: 's', subscriptionName: 'x', type: 'added', timestamp: t0, metadata: JSON.stringify({ cost: 10, cycle: 'monthly' }) },
        { id: 'b', subscriptionId: 's', subscriptionName: 'x', type: 'price_change', timestamp: t0 + MONTH, metadata: JSON.stringify({ oldCost: 10, newCost: 20, cycle: 'monthly' }) },
        { id: 'c', subscriptionId: 's', subscriptionName: 'x', type: 'cancelled', timestamp: t0 + 2 * MONTH, metadata: null },
      ],
      20,
      'monthly',
    );
    expect(total).toBeCloseTo(30, 5);
  });
  it('uses custom cycle length for custom subs', () => {
    const t0 = Date.now() - 2 * MONTH;
    const total = lifetimeCost(
      [{ id: 'a', subscriptionId: 's', subscriptionName: 'x', type: 'added', timestamp: t0, metadata: JSON.stringify({ cost: 20, cycle: 'custom' }) }],
      20,
      'custom',
      2,
      'months',
    );
    expect(total).toBeCloseTo(20, 1); // 10/month for 2 months
  });
});
