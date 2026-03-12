import * as SQLite from 'expo-sqlite';

const DB_NAME = 'drip.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (_db) return _db;
    _db = await SQLite.openDatabaseAsync(DB_NAME);
    await _db.execAsync('PRAGMA journal_mode = WAL;');
    await migrate(_db);
    return _db;
}

async function migrate(db: SQLite.SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT '📦',
            cost REAL NOT NULL,
            cycle TEXT NOT NULL DEFAULT 'monthly',
            category_id TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            bill_day INTEGER NOT NULL DEFAULT 1,
            start_date TEXT,
            is_trial INTEGER NOT NULL DEFAULT 0,
            trial_end_day INTEGER NOT NULL DEFAULT 0,
            trial_decision TEXT NOT NULL DEFAULT 'none',
            color TEXT NOT NULL DEFAULT '#000000',
            custom_num REAL,
            custom_unit TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS incomes (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            amount REAL NOT NULL,
            is_hourly INTEGER NOT NULL DEFAULT 0,
            hours_per_week REAL NOT NULL DEFAULT 40
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT '📦',
            color TEXT NOT NULL DEFAULT '#8E8E93',
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_default INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS spending_history (
            id TEXT PRIMARY KEY,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            total_monthly_cost REAL NOT NULL,
            category_breakdown TEXT NOT NULL DEFAULT '{}',
            subscription_count INTEGER NOT NULL DEFAULT 0,
            UNIQUE(month, year)
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // Migrate: add reminder_days column to existing subscriptions tables
    try {
        await db.execAsync('ALTER TABLE subscriptions ADD COLUMN reminder_days INTEGER;');
    } catch {
        // Column already exists — safe to ignore
    }

    // Seed default categories if empty
    const catCount = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM categories');
    if (!catCount || catCount.cnt === 0) {
        await db.execAsync(`
            INSERT OR IGNORE INTO categories (id, name, icon, color, sort_order, is_default) VALUES
                ('cat_entertainment', 'Entertainment', '🎭', '#FF3B30', 0, 1),
                ('cat_productivity', 'Productivity', '⚡', '#5B8DEF', 1, 1),
                ('cat_health', 'Health', '💚', '#4ECB71', 2, 1),
                ('cat_finance', 'Finance', '💰', '#F5C542', 3, 1),
                ('cat_education', 'Education', '📚', '#B07FE0', 4, 1),
                ('cat_other', 'Other', '📦', '#8E8E93', 5, 1);
        `);
    }
}
