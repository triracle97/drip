import i18n from '@/i18n';
import type { Sub } from '@/store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { daysBetween, fmt, nextChargeDate, parseLocalDate, startOfDay, toHrs } from './calc';

export const REMINDER_CHANNEL_ID = 'renewal-reminders';

/** How far ahead (days) reminders are scheduled. Rescheduled on every app foreground. */
const WINDOW_DAYS = 30;
/** Pending trials with no explicit reminder still get warned this many days before they convert. */
const DEFAULT_TRIAL_REMINDER_DAYS = 1;

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

let channelReady: Promise<void> | null = null;
function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return Promise.resolve();
    if (!channelReady) {
        channelReady = Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
            name: 'Renewal reminders',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        })
            .then(() => undefined)
            .catch((e) => {
                channelReady = null;
                console.warn('[notifications] channel setup failed', e);
            });
    }
    return channelReady;
}

export async function hasPermission(): Promise<boolean> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch {
        return false;
    }
}

export async function requestPermissions(): Promise<boolean> {
    await ensureAndroidChannel();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

// ─── PLAN (pure) ──────────────────────────

export interface PlannedNotification {
    date: Date;
    title: string;
    body: string;
    subIds: string[];
}

interface Entry {
    sub: Sub;
    /** Days between the reminder day and the charge day. */
    daysUntil: number;
    isTrial: boolean;
}

/** All charge dates of `sub` from today until `until` (inclusive). */
function chargeDatesUntil(sub: Sub, now: Date, until: Date): { date: Date; isTrial: boolean }[] {
    const out: { date: Date; isTrial: boolean }[] = [];
    const today = startOfDay(now);
    const trialEnd = parseLocalDate(sub.trialEndDay);
    const runningTrial = sub.isTrial && sub.trialDecision === 'pending' && !!trialEnd && trialEnd >= today;
    if (runningTrial) {
        // Only the conversion date matters for a running trial.
        if (trialEnd! <= until) out.push({ date: trialEnd!, isTrial: true });
        return out;
    }
    let d = nextChargeDate(sub, now);
    let guard = 0;
    while (d <= until && guard++ < 64) {
        out.push({ date: d, isTrial: false });
        const dayAfter = new Date(d);
        dayAfter.setDate(d.getDate() + 1);
        d = nextChargeDate(sub, dayAfter);
    }
    return out;
}

/**
 * Decide which reminders to schedule. One notification per day at `time`,
 * grouping every sub that needs a reminder that day.
 */
export function planNotifications(subs: Sub[], time: string, now: Date = new Date(), rate = 0): PlannedNotification[] {
    const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10) || 0);
    const today = startOfDay(now);
    const windowEnd = new Date(today);
    // Charges up to 7 days past the window can still have their reminder inside it.
    windowEnd.setDate(today.getDate() + WINDOW_DAYS + 7);

    const byDay = new Map<number, Entry[]>();

    for (const sub of subs) {
        const trialEnd = parseLocalDate(sub.trialEndDay);
        const pendingTrial = sub.isTrial && sub.trialDecision === 'pending' && !!trialEnd && trialEnd >= today;
        if (!sub.active && !pendingTrial) continue;
        const reminder = sub.reminderDays ?? (pendingTrial ? DEFAULT_TRIAL_REMINDER_DAYS : null);
        if (reminder == null) continue;

        for (const { date, isTrial } of chargeDatesUntil(sub, now, windowEnd)) {
            const chargeDay = daysBetween(today, date);
            let notifyDay = chargeDay - reminder;
            // A trial that ends sooner than its reminder lead time still gets a warning today.
            if (notifyDay < 0 && isTrial && chargeDay >= 1) notifyDay = 0;
            if (notifyDay < 0 || notifyDay > WINDOW_DAYS) continue;
            const list = byDay.get(notifyDay) ?? [];
            list.push({ sub, daysUntil: chargeDay - notifyDay, isTrial });
            byDay.set(notifyDay, list);
        }
    }

    const plan: PlannedNotification[] = [];
    for (const [day, entries] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        date.setHours(hours, minutes, 0, 0);
        if (date <= now) continue; // reminder time already passed today
        const { title, body } = buildNotificationContent(entries, rate);
        plan.push({ date, title, body, subIds: entries.map((e) => e.sub.id) });
    }
    return plan;
}

function whenLabel(days: number): string {
    if (days <= 0) return i18n.t('notif.today');
    if (days === 1) return i18n.t('notif.tomorrow');
    return i18n.t('notif.inDays', { count: days });
}

export function buildNotificationContent(entries: Entry[], rate = 0): { title: string; body: string } {
    if (entries.length === 1) {
        const { sub, daysUntil, isTrial } = entries[0];
        const when = whenLabel(daysUntil);
        const cost = fmt(sub.cost);
        return {
            title: isTrial
                ? i18n.t('notif.trialEnding', { name: sub.name, when })
                : i18n.t('notif.renewing', { name: sub.name, when }),
            body: rate > 0
                ? i18n.t('notif.costWithHours', { cost, hours: toHrs(sub.cost, rate) })
                : i18n.t('notif.cost', { cost }),
        };
    }

    const sameTiming = entries.every((e) => e.daysUntil === entries[0].daysUntil);
    if (sameTiming) {
        const when = whenLabel(entries[0].daysUntil);
        const allTrials = entries.every((e) => e.isTrial);
        return {
            title: allTrials
                ? i18n.t('notif.manyTrials', { count: entries.length, when })
                : i18n.t('notif.manyRenewing', { count: entries.length, when }),
            body: entries.map((e) => e.sub.name).join(', '),
        };
    }

    return {
        title: i18n.t('notif.upcoming'),
        body: entries
            .slice()
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .map((e) => `${e.sub.name} (${whenLabel(e.daysUntil)})`)
            .join(', '),
    };
}

/**
 * Drip's own free trial: the paywall promises a reminder before billing starts.
 * Fires 24h before the trial ends; skipped when that moment has already passed.
 */
export function planAppTrialReminder(
    trialEndsAt: string | null | undefined,
    now: Date = new Date(),
): PlannedNotification | null {
    if (!trialEndsAt) return null;
    const end = Date.parse(trialEndsAt);
    if (isNaN(end)) return null;
    const date = new Date(end - 24 * 60 * 60 * 1000);
    if (date <= now) return null;
    return {
        date,
        title: i18n.t('notif.appTrialTitle'),
        body: i18n.t('notif.appTrialBody'),
        subIds: [],
    };
}

// ─── SCHEDULING ───────────────────────────

interface RescheduleArgs {
    subs: Sub[];
    enabled: boolean;
    time: string;
    rate: number;
    /** End of Drip's own store free trial, when it will auto-renew. */
    appTrialEndsAt?: string | null;
}

let queue: Promise<void> = Promise.resolve();
let latest: RescheduleArgs | null = null;

async function doReschedule({ subs, enabled, time, rate, appTrialEndsAt }: RescheduleArgs): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!(await hasPermission())) return;
    await ensureAndroidChannel();

    // The trial-ending reminder was promised on the paywall, so it does not depend on
    // the renewal-reminder toggle — only on OS permission.
    const plan: PlannedNotification[] = [];
    const appTrial = planAppTrialReminder(appTrialEndsAt);
    if (appTrial) plan.push(appTrial);
    if (enabled) plan.push(...planNotifications(subs, time, new Date(), rate));

    for (const n of plan) {
        await Notifications.scheduleNotificationAsync({
            content: { title: n.title, body: n.body, sound: true, data: { subIds: n.subIds } },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: n.date,
                ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
            },
        });
    }
}

/**
 * Cancel and rebuild all reminders. Calls are serialized and coalesced: if several
 * arrive while one is running, only the most recent arguments are applied, so
 * overlapping cancel/schedule passes can never produce duplicate notifications.
 */
export function rescheduleAllNotifications(
    subs: Sub[],
    enabled: boolean,
    time: string,
    rate = 0,
    appTrialEndsAt: string | null = null,
): Promise<void> {
    latest = { subs, enabled, time, rate, appTrialEndsAt };
    queue = queue
        .then(async () => {
            const args = latest;
            latest = null;
            if (args) await doReschedule(args);
        })
        .catch((e) => console.warn('[notifications] reschedule failed', e));
    return queue;
}
