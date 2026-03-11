# Drip

Subscription tracker that reframes costs in work hours. Users add subscriptions with billing cycles, set their income/hourly rate, and see how many hours they work to pay for each service.

## Core Features

- **Subscription management** — Add/edit/remove subscriptions with flexible billing cycles (weekly, monthly, quarterly, yearly, custom). Track active, trial, and cancelled states.
- **Work-hours cost framing** — Converts subscription costs to work hours using blended hourly rate from income sources. The key differentiator: "this costs you 3h 20m of work."
- **Trial tracking** — Mark subscriptions as trials with end dates. Prompts keep/cancel decisions before trial expires.
- **Income & blended rate** — Multiple income sources (hourly or salary), blended into a single hourly rate for time-cost calculations.
- **Budget health** — % of income spent on subscriptions, with health tiers (Healthy < 5%, Moderate < 10%, High < 15%, Alert).
- **Insights tab** — Spending trends over time (monthly snapshots), category breakdown with donut chart, per-category % of income.
- **Calendar tab** — Timeline view of upcoming renewal dates.
- **Category system** — Customizable categories with icons/colors, reordering, reassignment on delete.

## Tech Stack

- **Framework**: Expo SDK 54 + Expo Router (file-based routing)
- **Language**: TypeScript + React Native
- **State**: React Context + useReducer with write-through to SQLite (`expo-sqlite`)
- **Persistence**: Local SQLite database via repository pattern (`store/db.ts`, `store/repository.ts`)
- **Backend**: Supabase client configured (`store/supabase.ts`) but primary data is local
- **Charts**: `react-native-gifted-charts` + custom SVG (`react-native-svg`)
- **Animations**: `react-native-reanimated` (scroll-driven hero, FadeInDown entries)
- **Design system**: Custom tokens in `constants/design.ts` (colors, radii, spacing, shadows, layout)

## Project Structure

```
app/
  (tabs)/          # Tab screens: index (home), calendar, insights, settings
  _layout.tsx      # Root layout with StoreProvider
  add.tsx          # Add subscription screen
  edit.tsx         # Edit subscription screen
  modal.tsx        # Modal screen
components/        # Reusable UI: SubRow, Card, Toast, TrialSheet, charts, etc.
constants/         # Design tokens (design.ts), theme
store/             # State management: index.tsx (context), db.ts, repository.ts, supabase.ts
utils/             # calc.ts (cost/time math, formatters), categories.ts (defaults)
```

## Key Patterns

- **Write-through persistence**: State updates dispatch to reducer AND call repository functions simultaneously
- **Monthly cost normalization**: All costs converted to monthly equivalent via `subMo()` / `moEq()` for comparison
- **Time tiers**: Subscription costs classified as Minimal/Low/Moderate/High/Very High/Extreme based on work hours
- **Spending snapshots**: Monthly snapshots recorded to SQLite for historical trend tracking
