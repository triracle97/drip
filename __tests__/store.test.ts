import { buildSnapshot, reducer, type Sub } from '@/store';
import { subMo } from '@/utils/calc';

jest.mock('@/store/repository', () => ({}));

const sub = (id: string, over: Partial<Sub> = {}): Sub => ({
  id, name: id, icon: '', cost: 10, cycle: 'monthly', categoryId: 'cat_a', active: true, billDay: 1,
  isTrial: false, trialEndDay: '', trialDecision: 'none', color: '#000', reminderDays: null, sortOrder: 0, ...over,
});

const base = (subs: Sub[]) => ({ subs, incomes: [], categories: [], spendingHistory: [], isLoaded: true });

describe('reducer', () => {
  it('REORDER_SUBS keeps subs missing from the id list (no crash on undefined)', () => {
    const st = reducer(base([sub('a'), sub('b'), sub('c')]), { type: 'REORDER_SUBS', ids: ['c', 'a', 'ghost'] });
    expect(st.subs.map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(st.subs.map((s) => s.sortOrder)).toEqual([0, 1, 0]);
  });

  it('DECIDE_TRIAL kept → paid & active; cancelled → inactive', () => {
    const t = sub('t', { isTrial: true, trialDecision: 'pending' });
    expect(reducer(base([t]), { type: 'DECIDE_TRIAL', id: 't', decision: 'kept' }).subs[0])
      .toMatchObject({ isTrial: false, trialDecision: 'kept', active: true });
    expect(reducer(base([t]), { type: 'DECIDE_TRIAL', id: 't', decision: 'cancelled' }).subs[0])
      .toMatchObject({ isTrial: false, trialDecision: 'cancelled', active: false });
  });

  it('REMOVE_CATEGORY reassigns subs', () => {
    const st = reducer(
      { ...base([sub('a', { categoryId: 'x' }), sub('b', { categoryId: 'y' })]), categories: [{ id: 'x', name: 'X', icon: '', color: '', sortOrder: 0, isDefault: false }] },
      { type: 'REMOVE_CATEGORY', id: 'x', reassignTo: 'cat_other' },
    );
    expect(st.categories).toHaveLength(0);
    expect(st.subs.map((s) => s.categoryId)).toEqual(['cat_other', 'y']);
  });

  it('UPDATE_SUB / REMOVE_SUB', () => {
    let st = reducer(base([sub('a'), sub('b')]), { type: 'UPDATE_SUB', sub: sub('a', { cost: 99 }) });
    expect(st.subs[0].cost).toBe(99);
    st = reducer(st, { type: 'REMOVE_SUB', id: 'a' });
    expect(st.subs.map((s) => s.id)).toEqual(['b']);
  });
});

describe('buildSnapshot', () => {
  it('counts only active, non-trial subs at their monthly equivalent', () => {
    const snap = buildSnapshot(
      [
        sub('a', { cost: 10 }),
        sub('b', { cost: 120, cycle: 'yearly', categoryId: 'cat_b' }),
        sub('trial', { isTrial: true, trialDecision: 'pending', cost: 50 }),
        sub('off', { active: false, cost: 70 }),
      ],
      new Date(2026, 10, 22),
      subMo,
    );
    expect(snap).toEqual({
      id: 'snap_2026_10',
      month: 10,
      year: 2026,
      totalMonthlyCost: 20,
      categoryBreakdown: { cat_a: 10, cat_b: 10 },
      subscriptionCount: 2,
    });
  });
});
