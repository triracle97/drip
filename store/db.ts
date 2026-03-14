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

    // Migrate: add sort_order column to subscriptions
    try {
        await db.execAsync('ALTER TABLE subscriptions ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;');
    } catch {
        // Column already exists — safe to ignore
    }

    // Event log for subscription changes
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS subscription_events (
    id TEXT PRIMARY KEY,
    subscriptionId TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    metadata TEXT,
    FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
  );
`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_sub_ts ON subscription_events(subscriptionId, timestamp);`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_ts ON subscription_events(timestamp);`);

    const existingSubs = await db.getAllAsync<{ id: string; created_at: string | null }>(
        `SELECT id, created_at FROM subscriptions WHERE id NOT IN (SELECT subscriptionId FROM subscription_events WHERE type = 'added')`
    );
    for (const row of existingSubs) {
        const ts = row.created_at ? new Date(row.created_at).getTime() : Date.now();
        await db.runAsync(
            `INSERT OR IGNORE INTO subscription_events (id, subscriptionId, type, timestamp, metadata) VALUES (?, ?, 'added', ?, ?)`,
            [`evt_${row.id}_added`, row.id, ts, JSON.stringify({ backfilled: true })]
        );
    }

    // Seed default categories if empty
    const catCount = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM categories');
    if (!catCount || catCount.cnt === 0) {
        await db.execAsync(`
            INSERT OR IGNORE INTO categories (id, name, icon, color, sort_order, is_default) VALUES
                ('cat_entertainment', 'Entertainment', '🎭', '#577E89', 0, 1),
                ('cat_productivity', 'Productivity', '⚡', '#E1A36F', 1, 1),
                ('cat_health', 'Health', '💚', '#5BA4A4', 2, 1),
                ('cat_finance', 'Finance', '💰', '#DEC484', 3, 1),
                ('cat_education', 'Education', '📚', '#8B7BA3', 4, 1),
                ('cat_other', 'Other', '📦', '#8E8E93', 5, 1);
        `);
    }

    // Migrate: update default category colors to muted neutral palette (v2)
    const migrated = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'cat_colors_v2'"
    );
    if (!migrated) {
        const idColorMap: Record<string, string> = {
            'cat_entertainment': '#577E89',  // Smalt blue
            'cat_productivity': '#E1A36F',  // Harvest gold
            'cat_health': '#5BA4A4',  // Teal
            'cat_finance': '#DEC484',  // Calico
            'cat_education': '#8B7BA3',  // Lavender
            'cat_other': '#8E8E93',  // System gray
        };
        for (const [id, newColor] of Object.entries(idColorMap)) {
            await db.runAsync(
                'UPDATE categories SET color = ? WHERE id = ? AND is_default = 1',
                newColor, id,
            );
        }
        await db.runAsync(
            "INSERT INTO settings (key, value) VALUES ('cat_colors_v2', '1') ON CONFLICT(key) DO UPDATE SET value='1'"
        );
    }
}
