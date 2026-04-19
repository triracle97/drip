import * as Notifications from 'expo-notifications';
import type { Sub } from '@/store';
import { nextChargeIn, cycleDays } from './calc';

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

export async function requestPermissions(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function rescheduleAllNotifications(
    subs: Sub[],
    enabled: boolean,
    time: string,
): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayISO = todayStart.toISOString().split('T')[0];

    // Build map: days-from-today → [{ sub, daysUntilRenewal }]
    const notifyMap = new Map<number, { sub: Sub; daysUntilRenewal: number }[]>();

    const eligible = subs.filter(s => s.active && s.reminderDays != null);

    for (const sub of eligible) {
        const daysCycle = cycleDays(sub);
        const nextCharge = nextChargeIn(sub);

        // Collect all renewal dates within 37-day window (30 + max reminderDays of 7)
        const renewalDaysFromNow: number[] = [];

        if (daysCycle <= 14) {
            // Weekly/biweekly: multiple renewals in window
            let d = nextCharge;
            while (d <= 37) {
                renewalDaysFromNow.push(d);
                d += daysCycle;
            }
        } else {
            // Monthly+: typically just the next one
            if (nextCharge <= 37) {
                renewalDaysFromNow.push(nextCharge);
            }
        }

        for (const renewalDay of renewalDaysFromNow) {
            const notifyDay = renewalDay - sub.reminderDays!;
            if (notifyDay >= 0 && notifyDay <= 30) {
                // Skip same-day notifications for subscriptions created today
                if (notifyDay === 0 && sub.startDate === todayISO) continue;
                const list = notifyMap.get(notifyDay) || [];
                list.push({ sub, daysUntilRenewal: sub.reminderDays! });
                notifyMap.set(notifyDay, list);
            }
        }
    }

    // Schedule one notification per day
    for (const [daysFromNow, entries] of notifyMap) {
        const triggerDate = new Date(todayStart);
        triggerDate.setDate(triggerDate.getDate() + daysFromNow);
        triggerDate.setHours(hours, minutes, 0, 0);

        // Skip if trigger time is in the past
        if (triggerDate <= now) continue;

        // Group by daysUntilRenewal for display
        const byTiming = new Map<number, string[]>();
        for (const { sub, daysUntilRenewal } of entries) {
            const list = byTiming.get(daysUntilRenewal) || [];
            list.push(sub.name);
            byTiming.set(daysUntilRenewal, list);
        }

        const { title, body } = buildNotificationContent(byTiming);

        await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: true },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });
    }
}

function timingLabel(days: number): string {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
}

function buildNotificationContent(byTiming: Map<number, string[]>): { title: string; body: string } {
    const totalSubs = Array.from(byTiming.values()).reduce((sum, names) => sum + names.length, 0);

    if (byTiming.size === 1) {
        const [days, names] = byTiming.entries().next().value as [number, string[]];
        if (names.length === 1) {
            return {
                title: `${names[0]} renewing ${timingLabel(days)}`,
                body: `Tap to review your subscription`,
            };
        }
        return {
            title: `${totalSubs} subscriptions renewing ${timingLabel(days)}`,
            body: names.join(', '),
        };
    }

    // Mixed timings
    const parts: string[] = [];
    for (const [days, names] of byTiming) {
        for (const name of names) {
            parts.push(`${name} (${timingLabel(days)})`);
        }
    }
    return {
        title: 'Upcoming renewals',
        body: parts.join(', '),
    };
}
