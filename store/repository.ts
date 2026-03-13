import { getDb } from './db';
import type { Category, Income, SpendingSnapshot, Sub } from './index';

// ─── SUBSCRIPTIONS ──────────────────────────

export async function getAllSubs(): Promise<Sub[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM subscriptions ORDER BY sort_order ASC, created_at DESC');
    return rows.map(rowToSub);
}

export async function insertSub(s: Sub): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `INSERT INTO subscriptions (id, name, icon, cost, cycle, category_id, active, bill_day, start_date, is_trial, trial_end_day, trial_decision, color, custom_num, custom_unit, reminder_days, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        s.id, s.name, s.icon, s.cost, s.cycle, s.categoryId, s.active ? 1 : 0, s.billDay,
        s.startDate ?? null, s.isTrial ? 1 : 0, s.trialEndDay, s.trialDecision, s.color,
        s.customNum ?? null, s.customUnit ?? null, s.reminderDays ?? null, s.sortOrder ?? 0,
    );
}

export async function updateSub(s: Sub): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `UPDATE subscriptions SET name=?, icon=?, cost=?, cycle=?, category_id=?, active=?, bill_day=?, start_date=?, is_trial=?, trial_end_day=?, trial_decision=?, color=?, custom_num=?, custom_unit=?, reminder_days=?, sort_order=?, updated_at=datetime('now')
         WHERE id=?`,
        s.name, s.icon, s.cost, s.cycle, s.categoryId, s.active ? 1 : 0, s.billDay,
        s.startDate ?? null, s.isTrial ? 1 : 0, s.trialEndDay, s.trialDecision, s.color,
        s.customNum ?? null, s.customUnit ?? null, s.reminderDays ?? null, s.sortOrder ?? 0, s.id,
    );
}

export async function deleteSub(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM subscriptions WHERE id=?', id);
}

function rowToSub(r: any): Sub {
    return {
        id: r.id,
        name: r.name,
        icon: r.icon,
        cost: r.cost,
        cycle: r.cycle,
        categoryId: r.category_id ?? 'cat_other',
        active: !!r.active,
        billDay: r.bill_day,
        startDate: r.start_date ?? undefined,
        isTrial: !!r.is_trial,
        trialEndDay: r.trial_end_day,
        trialDecision: r.trial_decision,
        color: r.color,
        customNum: r.custom_num ?? undefined,
        customUnit: r.custom_unit ?? undefined,
        reminderDays: r.reminder_days ?? null,
        sortOrder: r.sort_order ?? 0,
    };
}

export async function reorderSubs(ids: string[]): Promise<void> {
    const db = await getDb();
    for (let i = 0; i < ids.length; i++) {
        await db.runAsync('UPDATE subscriptions SET sort_order=? WHERE id=?', i, ids[i]);
    }
}

// ─── INCOMES ────────────────────────────────

export async function getAllIncomes(): Promise<Income[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM incomes');
    return rows.map(r => ({
        id: r.id,
        label: r.label,
        amount: r.amount,
        isHourly: !!r.is_hourly,
        hoursPerWeek: r.hours_per_week,
    }));
}

export async function insertIncome(i: Income): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'INSERT INTO incomes (id, label, amount, is_hourly, hours_per_week) VALUES (?, ?, ?, ?, ?)',
        i.id, i.label, i.amount, i.isHourly ? 1 : 0, i.hoursPerWeek,
    );
}

export async function updateIncome(i: Income): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE incomes SET label=?, amount=?, is_hourly=?, hours_per_week=? WHERE id=?',
        i.label, i.amount, i.isHourly ? 1 : 0, i.hoursPerWeek, i.id,
    );
}

export async function deleteIncome(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM incomes WHERE id=?', id);
}

// ─── CATEGORIES ─────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY sort_order ASC');
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        sortOrder: r.sort_order,
        isDefault: !!r.is_default,
    }));
}

export async function upsertCategory(c: Category): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, sort_order, is_default) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, color=excluded.color, sort_order=excluded.sort_order`,
        c.id, c.name, c.icon, c.color, c.sortOrder, c.isDefault ? 1 : 0,
    );
}

export async function deleteCategory(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM categories WHERE id=?', id);
}

export async function reorderCategories(ids: string[]): Promise<void> {
    const db = await getDb();
    for (let i = 0; i < ids.length; i++) {
        await db.runAsync('UPDATE categories SET sort_order=? WHERE id=?', i, ids[i]);
    }
}

// ─── SETTINGS ──────────────────────────────

export async function getAllSettings(): Promise<Record<string, string>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value; });
    return map;
}

export async function setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
        key, value,
    );
}

// ─── SPENDING HISTORY ───────────────────────

export async function getSpendingHistory(): Promise<SpendingSnapshot[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM spending_history ORDER BY year DESC, month DESC');
    return rows.map(r => ({
        id: r.id,
        month: r.month,
        year: r.year,
        totalMonthlyCost: r.total_monthly_cost,
        categoryBreakdown: JSON.parse(r.category_breakdown),
        subscriptionCount: r.subscription_count,
    }));
}

export async function recordMonthlySnapshot(snapshot: SpendingSnapshot): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `INSERT INTO spending_history (id, month, year, total_monthly_cost, category_breakdown, subscription_count)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(month, year) DO UPDATE SET total_monthly_cost=excluded.total_monthly_cost, category_breakdown=excluded.category_breakdown, subscription_count=excluded.subscription_count`,
        snapshot.id, snapshot.month, snapshot.year, snapshot.totalMonthlyCost,
        JSON.stringify(snapshot.categoryBreakdown), snapshot.subscriptionCount,
    );
}
