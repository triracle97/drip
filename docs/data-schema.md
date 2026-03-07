# Drip — Data Schema Architecture

## Overview

Drip uses a **dual-layer data architecture**:
1. **SQLite (local)** — user data persistence via `expo-sqlite`
2. **Supabase (remote)** — popular subscription templates, cached with network-first strategy

The in-memory state is managed by React `useReducer` with **write-through** to SQLite on every mutation.

---

## SQLite Schema

### `subscriptions`
User's tracked subscriptions.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | TEXT PK | | `s{timestamp}` |
| name | TEXT | | |
| icon | TEXT | '📦' | Emoji |
| cost | REAL | | Per-cycle cost |
| cycle | TEXT | 'monthly' | weekly/biweekly/monthly/quarterly/biannual/yearly/custom |
| category_id | TEXT | | FK to categories.id |
| active | INTEGER | 1 | Boolean |
| bill_day | INTEGER | 1 | Day of month |
| start_date | TEXT | | ISO date |
| is_trial | INTEGER | 0 | Boolean |
| trial_end_day | INTEGER | 0 | Day of month trial ends |
| trial_decision | TEXT | 'none' | none/pending/kept/cancelled |
| color | TEXT | '#000000' | Hex color |
| custom_num | REAL | NULL | For custom cycles |
| custom_unit | TEXT | NULL | weeks/months/years |
| created_at | TEXT | datetime('now') | |
| updated_at | TEXT | datetime('now') | |

### `incomes`
User's income sources for work-hours cost conversion.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | TEXT PK | | `i{timestamp}` |
| label | TEXT | | e.g. "Full-time salary" |
| amount | REAL | | Annual salary or hourly rate |
| is_hourly | INTEGER | 0 | Boolean |
| hours_per_week | REAL | 40 | |

### `categories`
User-customizable categories. 6 defaults seeded on first launch.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | TEXT PK | | `cat_{name}` or `cat_{timestamp}` |
| name | TEXT | | |
| icon | TEXT | '📦' | Emoji |
| color | TEXT | '#8E8E93' | Hex color |
| sort_order | INTEGER | 0 | For drag reorder |
| is_default | INTEGER | 0 | Prevents deletion of system categories |

Default categories: Entertainment, Productivity, Health, Finance, Education, Other.

### `spending_history`
Monthly snapshots for trend analysis. Auto-recorded on app open.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | TEXT PK | | `snap_{year}_{month}` |
| month | INTEGER | | 0-11 |
| year | INTEGER | | |
| total_monthly_cost | REAL | | |
| category_breakdown | TEXT | '{}' | JSON: `{categoryId: amount}` |
| subscription_count | INTEGER | 0 | |
| | | | UNIQUE(month, year) — upserts |

---

## Supabase Schema

### `popular_subscriptions` (remote)
Pre-populated subscription templates users can pick from when adding.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `pop_{name}` |
| name | TEXT | |
| icon | TEXT | Emoji |
| default_cost | REAL | Default price |
| default_cycle | TEXT | Usually 'monthly' |
| category_id | TEXT | Maps to local category IDs |
| color | TEXT | Brand color |

**Caching strategy**: In-memory cache with 1-hour TTL. Network-first with stale cache fallback. Hardcoded fallback (10 popular services) if offline and no cache.

---

## Data Flow

```
App Launch
    → SQLite: load subs, incomes, categories, spending_history
    → Dispatch LOAD_DATA → reducer populates state
    → isLoaded = true → render app

User Action (add/edit/delete)
    → Dispatch action → reducer updates state (immediate UI)
    → Write-through → SQLite persisted (async, fire-and-forget)

Add Screen
    → Supabase: getPopularSubs() (cached)
    → User picks template or custom
    → Dispatch ADD_SUB → SQLite write-through

Insights Tab
    → On mount: recordSnapshot() → upsert current month
    → Read spendingHistory from state
    → Render charts from snapshot data

Category Change
    → Dispatch UPDATE_CATEGORY → SQLite upsert
    → On delete: reassign subs to fallback category (both state + SQLite)
```

---

## TypeScript Interfaces

```typescript
interface Sub {
    id: string;
    name: string;
    icon: string;
    cost: number;
    cycle: string;
    categoryId: string;  // FK to Category.id
    active: boolean;
    billDay: number;
    startDate?: string;
    isTrial: boolean;
    trialEndDay: number;
    trialDecision: string;
    color: string;
    customNum?: number;
    customUnit?: string;
}

interface Income {
    id: string;
    label: string;
    amount: number;
    isHourly: boolean;
    hoursPerWeek: number;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    sortOrder: number;
    isDefault: boolean;
}

interface SpendingSnapshot {
    id: string;
    month: number;
    year: number;
    totalMonthlyCost: number;
    categoryBreakdown: Record<string, number>;
    subscriptionCount: number;
}
```
