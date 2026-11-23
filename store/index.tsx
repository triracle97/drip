import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import * as repo from './repository';
import { migrateSettingsFromSQLite } from './settings';

// ─── DATA TYPES ───────────────────────────
export interface Sub {
    id: string;
    name: string;
    icon: string;
    cost: number;
    cycle: string;
    categoryId: string;
    active: boolean;
    billDay: number;
    startDate?: string;
    isTrial: boolean;
    trialEndDay: string;
    trialDecision: string;
    color: string;
    customNum?: number;
    customUnit?: string;
    reminderDays: number | null;
    sortOrder: number;
}

export interface Income {
    id: string;
    label: string;
    amount: number;
    isHourly: boolean;
    hoursPerWeek: number;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    sortOrder: number;
    isDefault: boolean;
}

export interface SpendingSnapshot {
    id: string;
    month: number;
    year: number;
    totalMonthlyCost: number;
    categoryBreakdown: Record<string, number>;
    subscriptionCount: number;
}

// ─── STATE & ACTIONS ──────────────────────
type State = {
    subs: Sub[];
    incomes: Income[];
    categories: Category[];
    spendingHistory: SpendingSnapshot[];
    isLoaded: boolean;
};

type Action =
    | { type: 'LOAD_DATA'; subs: Sub[]; incomes: Income[]; categories: Category[]; spendingHistory: SpendingSnapshot[] }
    | { type: 'ADD_SUB'; sub: Sub }
    | { type: 'UPDATE_SUB'; sub: Sub }
    | { type: 'REMOVE_SUB'; id: string }
    | { type: 'ADD_INCOME'; income: Income }
    | { type: 'UPDATE_INCOME'; income: Income }
    | { type: 'REMOVE_INCOME'; id: string }
    | { type: 'DECIDE_TRIAL'; id: string; decision: 'kept' | 'cancelled' }
    | { type: 'REORDER_SUBS'; ids: string[] }
    | { type: 'ADD_CATEGORY'; category: Category }
    | { type: 'UPDATE_CATEGORY'; category: Category }
    | { type: 'REMOVE_CATEGORY'; id: string; reassignTo: string }
    | { type: 'REORDER_CATEGORIES'; ids: string[] }
    | { type: 'SET_SPENDING_HISTORY'; history: SpendingSnapshot[] };

const INIT_STATE: State = {
    subs: [],
    incomes: [],
    categories: [],
    spendingHistory: [],
    isLoaded: false,
};

/** Write-through calls are fire-and-forget; never let a failed write become an unhandled rejection. */
const logDbError = (e: unknown) => console.warn('[store] DB write failed', e);

/** Monthly snapshot of current spending (pure — exported for tests). */
export function buildSnapshot(subs: Sub[], now: Date, monthlyOf: (s: Sub) => number): SpendingSnapshot {
    const month = now.getMonth();
    const year = now.getFullYear();
    const activeSubs = subs.filter(s => s.active && !s.isTrial);
    const categoryBreakdown: Record<string, number> = {};
    let totalMonthlyCost = 0;
    for (const s of activeSubs) {
        const mo = monthlyOf(s);
        totalMonthlyCost += mo;
        categoryBreakdown[s.categoryId] = (categoryBreakdown[s.categoryId] || 0) + mo;
    }
    return {
        id: `snap_${year}_${month}`,
        month,
        year,
        totalMonthlyCost,
        categoryBreakdown,
        subscriptionCount: activeSubs.length,
    };
}

export function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'LOAD_DATA':
            return {
                subs: action.subs,
                incomes: action.incomes,
                categories: action.categories,
                spendingHistory: action.spendingHistory,
                isLoaded: true,
            };
        case 'ADD_SUB':
            return { ...state, subs: [...state.subs, action.sub] };
        case 'UPDATE_SUB':
            return { ...state, subs: state.subs.map(s => s.id === action.sub.id ? action.sub : s) };
        case 'REMOVE_SUB':
            return { ...state, subs: state.subs.filter(s => s.id !== action.id) };
        case 'ADD_INCOME':
            return { ...state, incomes: [...state.incomes, action.income] };
        case 'UPDATE_INCOME':
            return { ...state, incomes: state.incomes.map(i => i.id === action.income.id ? action.income : i) };
        case 'REMOVE_INCOME':
            return { ...state, incomes: state.incomes.filter(i => i.id !== action.id) };
        case 'DECIDE_TRIAL':
            return {
                ...state,
                subs: state.subs.map(s => {
                    if (s.id !== action.id) return s;
                    if (action.decision === 'kept') return { ...s, isTrial: false, trialDecision: 'kept', active: true };
                    return { ...s, isTrial: false, trialDecision: 'cancelled', active: false };
                }),
            };
        case 'REORDER_SUBS': {
            const byId = new Map(state.subs.map(s => [s.id, s]));
            const ordered = action.ids
                .map((id, i) => {
                    const sub = byId.get(id);
                    if (!sub) return null;
                    byId.delete(id);
                    return { ...sub, sortOrder: i };
                })
                .filter((s): s is Sub => s !== null);
            // Subs missing from `ids` (e.g. a filtered list was reordered) keep their place at the end.
            return { ...state, subs: [...ordered, ...byId.values()] };
        }
        case 'ADD_CATEGORY':
            return { ...state, categories: [...state.categories, action.category] };
        case 'UPDATE_CATEGORY':
            return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) };
        case 'REMOVE_CATEGORY':
            return {
                ...state,
                categories: state.categories.filter(c => c.id !== action.id),
                subs: state.subs.map(s => s.categoryId === action.id ? { ...s, categoryId: action.reassignTo } : s),
            };
        case 'REORDER_CATEGORIES': {
            const byId = new Map(state.categories.map(c => [c.id, c]));
            const ordered = action.ids
                .map((id, i) => {
                    const cat = byId.get(id);
                    if (!cat) return null;
                    byId.delete(id);
                    return { ...cat, sortOrder: i };
                })
                .filter((c): c is Category => c !== null);
            return { ...state, categories: [...ordered, ...byId.values()] };
        }
        case 'SET_SPENDING_HISTORY':
            return { ...state, spendingHistory: action.history };
        default:
            return state;
    }
}

// ─── CONTEXT ──────────────────────────────
type Ctx = {
    subs: Sub[];
    incomes: Income[];
    categories: Category[];
    spendingHistory: SpendingSnapshot[];
    isLoaded: boolean;
    addSub: (s: Sub) => void;
    updateSub: (s: Sub) => void;
    removeSub: (id: string) => void;
    addIncome: (i: Income) => void;
    updateIncome: (i: Income) => void;
    removeIncome: (id: string) => void;
    reorderSubs: (ids: string[]) => void;
    decideTrial: (id: string, decision: 'kept' | 'cancelled') => void;
    addCategory: (c: Category) => void;
    updateCategory: (c: Category) => void;
    removeCategory: (id: string, reassignTo: string) => void;
    reorderCategories: (ids: string[]) => void;
    recordSnapshot: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, INIT_STATE);
    // Latest subs for callbacks, so they can stay referentially stable (no stale closures).
    const subsRef = useRef(state.subs);
    subsRef.current = state.subs;
    // Set when the initial DB read failed: never write a snapshot built from empty data.
    const loadFailedRef = useRef(false);

    // Load from SQLite on mount
    useEffect(() => {
        (async () => {
            try {
                const [subs, incomes, categories, spendingHistory] = await Promise.all([
                    repo.getAllSubs(),
                    repo.getAllIncomes(),
                    repo.getAllCategories(),
                    repo.getSpendingHistory(),
                ]);
                dispatch({ type: 'LOAD_DATA', subs, incomes, categories, spendingHistory });
            } catch (e) {
                console.error('[store] initial load failed', e);
                loadFailedRef.current = true;
                // Don't leave the app stuck on the splash spinner.
                dispatch({ type: 'LOAD_DATA', subs: [], incomes: [], categories: [], spendingHistory: [] });
            }
            migrateSettingsFromSQLite();
        })();
    }, []);

    // Write-through helpers
    const addSub = useCallback((sub: Sub) => {
        dispatch({ type: 'ADD_SUB', sub });
        repo.insertSub(sub).catch(logDbError);
        repo.insertEvent({
            id: `evt_${sub.id}_${Date.now()}`,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            type: 'added',
            timestamp: Date.now(),
            metadata: JSON.stringify({ cost: sub.cost, cycle: sub.cycle }),
        }).catch(logDbError);
    }, []);

    const updateSub = useCallback((sub: Sub) => {
        const old = subsRef.current.find(s => s.id === sub.id);
        dispatch({ type: 'UPDATE_SUB', sub });
        repo.updateSub(sub).catch(logDbError);
        if (old) {
            if (old.cost !== sub.cost) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_price`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'price_change',
                    timestamp: Date.now(),
                    metadata: JSON.stringify({ oldCost: old.cost, newCost: sub.cost, cycle: sub.cycle }),
                }).catch(logDbError);
            }
            if (old.cycle !== sub.cycle) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_cycle`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'cycle_change',
                    timestamp: Date.now(),
                    metadata: JSON.stringify({ oldCycle: old.cycle, newCycle: sub.cycle, cost: sub.cost }),
                }).catch(logDbError);
            }
            if (old.active && !sub.active) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_cancel`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'cancelled',
                    timestamp: Date.now(),
                    metadata: null,
                }).catch(logDbError);
            }
            if (!old.active && sub.active) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_reactivate`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'reactivated',
                    timestamp: Date.now(),
                    metadata: null,
                }).catch(logDbError);
            }
        }
    }, []);

    const removeSub = useCallback((id: string) => {
        const sub = subsRef.current.find(s => s.id === id);
        // Only log cancelled event if the sub is still active — if it was already
        // toggled inactive, updateSub already logged a cancelled event.
        if (sub?.active) {
            repo.insertEvent({
                id: `evt_${id}_${Date.now()}_cancel`,
                subscriptionId: id,
                subscriptionName: sub.name,
                type: 'cancelled',
                timestamp: Date.now(),
                metadata: null,
            }).catch(logDbError);
        }
        dispatch({ type: 'REMOVE_SUB', id });
        repo.deleteSub(id).catch(logDbError);
    }, []);

    const addIncome = useCallback((income: Income) => {
        dispatch({ type: 'ADD_INCOME', income });
        repo.insertIncome(income).catch(logDbError);
    }, []);

    const updateIncome = useCallback((income: Income) => {
        dispatch({ type: 'UPDATE_INCOME', income });
        repo.updateIncome(income).catch(logDbError);
    }, []);

    const removeIncome = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_INCOME', id });
        repo.deleteIncome(id).catch(logDbError);
    }, []);

    const reorderSubs = useCallback((ids: string[]) => {
        dispatch({ type: 'REORDER_SUBS', ids });
        repo.reorderSubs(ids).catch(logDbError);
    }, []);

    const decideTrial = useCallback((id: string, decision: 'kept' | 'cancelled') => {
        dispatch({ type: 'DECIDE_TRIAL', id, decision });
        // Write-through: update the sub in SQLite
        const sub = subsRef.current.find(s => s.id === id);
        if (sub) {
            const updated = decision === 'kept'
                ? { ...sub, isTrial: false, trialDecision: 'kept', active: true }
                : { ...sub, isTrial: false, trialDecision: 'cancelled', active: false };
            repo.updateSub(updated).catch(logDbError);
            repo.insertEvent({
                id: `evt_${id}_${Date.now()}_trial`,
                subscriptionId: id,
                subscriptionName: sub.name,
                type: decision === 'kept' ? 'reactivated' : 'cancelled',
                timestamp: Date.now(),
                metadata: JSON.stringify({ fromTrial: true }),
            }).catch(logDbError);
        }
    }, []);

    const addCategory = useCallback((category: Category) => {
        dispatch({ type: 'ADD_CATEGORY', category });
        repo.upsertCategory(category).catch(logDbError);
    }, []);

    const updateCategory = useCallback((category: Category) => {
        dispatch({ type: 'UPDATE_CATEGORY', category });
        repo.upsertCategory(category).catch(logDbError);
    }, []);

    const removeCategory = useCallback((id: string, reassignTo: string) => {
        dispatch({ type: 'REMOVE_CATEGORY', id, reassignTo });
        repo.deleteCategory(id, reassignTo).catch(logDbError);
    }, []);

    const reorderCategories = useCallback((ids: string[]) => {
        dispatch({ type: 'REORDER_CATEGORIES', ids });
        repo.reorderCategories(ids).catch(logDbError);
    }, []);

    const recordSnapshot = useCallback(() => {
        if (loadFailedRef.current) return;
        const { subMo } = require('@/utils/calc');
        const snapshot = buildSnapshot(subsRef.current, new Date(), subMo);
        repo.recordMonthlySnapshot(snapshot)
            .then(() => repo.getSpendingHistory())
            .then(history => dispatch({ type: 'SET_SPENDING_HISTORY', history }))
            .catch(logDbError);
    }, []);

    // Keep this month's spending snapshot current (insights trend + past-month calendar),
    // regardless of which tab is open. Debounced so bulk edits write once.
    // Only fields that affect spending count: reordering must not trigger a DB write
    // + history reload (and the extra re-render of every screen) right after a drop.
    const spendKey = useMemo(
        () => state.subs
            .map(s => `${s.id}|${s.cost}|${s.cycle}|${s.customNum ?? ''}|${s.customUnit ?? ''}|${s.active}|${s.isTrial}|${s.categoryId}`)
            .sort()
            .join(';'),
        [state.subs],
    );
    useEffect(() => {
        if (!state.isLoaded) return;
        const timer = setTimeout(recordSnapshot, 400);
        return () => clearTimeout(timer);
    }, [state.isLoaded, spendKey, recordSnapshot]);

    const value = useMemo<Ctx>(() => ({
        subs: state.subs,
        incomes: state.incomes,
        categories: state.categories,
        spendingHistory: state.spendingHistory,
        isLoaded: state.isLoaded,
        addSub, updateSub, removeSub, reorderSubs,
        addIncome, updateIncome, removeIncome,
        decideTrial,
        addCategory, updateCategory, removeCategory, reorderCategories,
        recordSnapshot,
    }), [state, addSub, updateSub, removeSub, reorderSubs, addIncome, updateIncome, removeIncome,
        decideTrial, addCategory, updateCategory, removeCategory, reorderCategories, recordSnapshot]);

    return (
        <StoreCtx.Provider value={value}>
            {children}
        </StoreCtx.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreCtx);
    if (!ctx) throw new Error('useStore must be inside StoreProvider');
    return ctx;
}
