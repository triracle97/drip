import type { Sub } from '@/store';
import * as Notifications from 'expo-notifications';
import { planNotifications, rescheduleAllNotifications } from '@/utils/notifications';
import { toLocalISO } from '@/utils/calc';

const N = Notifications as any;

const sub = (over: Partial<Sub> = {}): Sub => ({
  id: over.id ?? 's1',
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
  reminderDays: 3,
  sortOrder: 0,
  ...over,
});

const now = new Date(2026, 10, 22, 7, 0); // Nov 22 2026 07:00 local
const day = (n: Date) => toLocalISO(n);

describe('planNotifications', () => {
  it('monthly: one reminder `reminderDays` before the charge, at the chosen time', () => {
    const plan = planNotifications([sub({ startDate: '2026-01-02' })], '08:30', now);
    expect(plan).toHaveLength(1);
    expect(day(plan[0].date)).toBe('2026-11-29'); // charge Dec 2, 3 days before
    expect(plan[0].date.getHours()).toBe(8);
    expect(plan[0].date.getMinutes()).toBe(30);
    expect(plan[0].title).toBe('Netflix renews in 3 days');
    expect(plan[0].body).toContain('15.00');
  });

  it('includes work hours when a rate is known', () => {
    const plan = planNotifications([sub({ startDate: '2026-01-02' })], '08:00', now, 30);
    expect(plan[0].body).toBe("$15.00 — that's 30min of your work");
  });

  it('weekly: a reminder for every charge in the 30-day window, 7 days apart', () => {
    const plan = planNotifications([sub({ cycle: 'weekly', startDate: '2026-11-20', reminderDays: 1 })], '08:00', now);
    const days = plan.map((p) => day(p.date));
    expect(days).toEqual(['2026-11-26', '2026-12-03', '2026-12-10', '2026-12-17']);
  });

  it('yearly sub far away: nothing scheduled (regression: was treated as next month)', () => {
    expect(planNotifications([sub({ cycle: 'yearly', startDate: '2026-03-15' })], '08:00', now)).toHaveLength(0);
  });

  it('skips inactive subs and subs without reminders', () => {
    expect(planNotifications([sub({ active: false, startDate: '2026-01-02' })], '08:00', now)).toHaveLength(0);
    expect(planNotifications([sub({ reminderDays: null, startDate: '2026-01-02' })], '08:00', now)).toHaveLength(0);
  });

  it('pending trial without an explicit reminder is still warned 1 day before it converts', () => {
    const plan = planNotifications(
      [sub({ isTrial: true, trialDecision: 'pending', trialEndDay: '2026-11-27', reminderDays: null, startDate: '2026-11-20' })],
      '08:00',
      now,
    );
    expect(plan).toHaveLength(1);
    expect(day(plan[0].date)).toBe('2026-11-26');
    expect(plan[0].title).toBe('Netflix free trial ends tomorrow');
  });

  it('trial ending sooner than the reminder lead time is warned today', () => {
    const plan = planNotifications(
      [sub({ isTrial: true, trialDecision: 'pending', trialEndDay: '2026-11-24', reminderDays: 7, startDate: '2026-11-17' })],
      '08:00',
      now,
    );
    expect(plan).toHaveLength(1);
    expect(day(plan[0].date)).toBe('2026-11-22');
    expect(plan[0].title).toBe('Netflix free trial ends in 2 days');
  });

  it("drops today's reminder when the time has already passed", () => {
    const late = new Date(2026, 10, 22, 21, 0);
    const plan = planNotifications([sub({ startDate: '2026-01-25' })], '08:00', late); // charge Nov 25, notify Nov 22
    // Today's 08:00 slot is gone; only next cycle's reminder (Dec 25 → Dec 22) remains.
    expect(plan.map((p) => day(p.date))).toEqual(['2026-12-22']);
  });

  it('monthly: when the next reminder already passed, the following cycle is still scheduled (regression)', () => {
    // charges Nov 23 (reminder Nov 20, past) and Dec 23 (reminder Dec 20)
    const plan = planNotifications([sub({ startDate: '2026-01-23' })], '08:00', now);
    expect(plan.map((p) => day(p.date))).toEqual(['2026-12-20']);
  });

  it('trial that ended but is still undecided is reminded as a normal renewal (regression)', () => {
    const plan = planNotifications(
      [sub({ isTrial: true, trialDecision: 'pending', trialEndDay: '2026-11-10', startDate: '2026-11-03', reminderDays: 1 })],
      '08:00',
      now,
    );
    expect(plan[0].title).toBe('Netflix renews tomorrow');
    expect(day(plan[0].date)).toBe('2026-12-02');
  });

  it('groups subs reminded on the same day', () => {
    const plan = planNotifications(
      [
        sub({ id: 'a', name: 'Netflix', startDate: '2026-01-02' }),
        sub({ id: 'b', name: 'Spotify', startDate: '2026-01-02' }),
      ],
      '08:00',
      now,
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].title).toBe('2 subscriptions renew in 3 days');
    expect(plan[0].body).toBe('Netflix, Spotify');
    expect(plan[0].subIds).toEqual(['a', 'b']);
  });

  it('mixed lead times on one day get a combined summary', () => {
    const plan = planNotifications(
      [
        sub({ id: 'a', name: 'Netflix', startDate: '2026-01-02', reminderDays: 3 }), // Dec 2 → notify Nov 29
        sub({ id: 'b', name: 'Spotify', startDate: '2026-01-30', reminderDays: 1 }), // Nov 30 → notify Nov 29
      ],
      '08:00',
      now,
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].title).toBe('Upcoming renewals');
    expect(plan[0].body).toBe('Spotify (tomorrow), Netflix (in 3 days)');
  });
});

describe('rescheduleAllNotifications', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now, doNotFake: ['setTimeout', 'setImmediate', 'nextTick', 'queueMicrotask'] });
    jest.clearAllMocks();
    N.__scheduled.length = 0;
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  });
  afterEach(() => jest.useRealTimers());

  const subs = [
    sub({ id: 'a', startDate: '2026-01-02' }),
    sub({ id: 'b', cycle: 'weekly', startDate: '2026-11-20', reminderDays: 1 }),
  ];

  it('schedules the plan', async () => {
    await rescheduleAllNotifications(subs, true, '08:00');
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(N.__scheduled).toHaveLength(5);
  });

  it('concurrent calls never produce duplicates (regression)', async () => {
    // Slow scheduling so calls would interleave without serialization.
    N.scheduleNotificationAsync.mockImplementation(async (req: any) => {
      await new Promise((r) => setTimeout(r, 1));
      N.__scheduled.push(req);
      return 'id';
    });
    await Promise.all([
      rescheduleAllNotifications(subs, true, '08:00'),
      rescheduleAllNotifications(subs, true, '08:00'),
      rescheduleAllNotifications(subs, true, '08:00'),
    ]);
    expect(N.__scheduled).toHaveLength(5);
  });

  it('applies only the latest arguments when calls pile up', async () => {
    const p1 = rescheduleAllNotifications(subs, true, '08:00');
    const p2 = rescheduleAllNotifications(subs, false, '08:00');
    await Promise.all([p1, p2]);
    expect(N.__scheduled).toHaveLength(0);
  });

  it('disabled → everything cancelled, nothing scheduled', async () => {
    await rescheduleAllNotifications(subs, false, '08:00');
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('permission revoked → nothing scheduled', async () => {
    N.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await rescheduleAllNotifications(subs, true, '08:00');
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('a failing schedule call does not break later reschedules', async () => {
    N.scheduleNotificationAsync.mockRejectedValueOnce(new Error('boom'));
    await rescheduleAllNotifications(subs, true, '08:00');
    N.scheduleNotificationAsync.mockImplementation(async (req: any) => { N.__scheduled.push(req); return 'id'; });
    N.__scheduled.length = 0;
    await rescheduleAllNotifications(subs, true, '08:00');
    expect(N.__scheduled).toHaveLength(5);
  });
});

describe("Drip's own trial reminder", () => {
  const { planAppTrialReminder } = require('@/utils/notifications');
  beforeEach(() => {
    jest.clearAllMocks();
    N.__scheduled.length = 0;
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  });

  it('fires 24h before the store trial ends', () => {
    const r = planAppTrialReminder('2026-11-25T07:00:00.000Z', new Date('2026-11-22T07:00:00.000Z'));
    expect(r.date.toISOString()).toBe('2026-11-24T07:00:00.000Z');
    expect(r.title).toBe('Your Drip free trial ends tomorrow');
  });

  it('skips when less than a day is left or no trial', () => {
    expect(planAppTrialReminder('2026-11-22T20:00:00.000Z', new Date('2026-11-22T07:00:00.000Z'))).toBeNull();
    expect(planAppTrialReminder(null)).toBeNull();
  });

  it('is scheduled even when renewal reminders are turned off', async () => {
    const end = new Date(Date.now() + 3 * 86400000).toISOString();
    await rescheduleAllNotifications([], false, '08:00', 0, end);
    expect(N.__scheduled).toHaveLength(1);
    expect(N.__scheduled[0].content.title).toBe('Your Drip free trial ends tomorrow');
  });
});
