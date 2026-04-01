import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
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

function reducer(state: State, action: Action): State {
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
        case 'REORDER_SUBS':
            return {
                ...state,
                subs: action.ids.map((id, i) => {
                    const sub = state.subs.find(s => s.id === id)!;
                    return { ...sub, sortOrder: i };
                }),
            };
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
        case 'REORDER_CATEGORIES':
            return {
                ...state,
                categories: action.ids.map((id, i) => {
                    const cat = state.categories.find(c => c.id === id)!;
                    return { ...cat, sortOrder: i };
                }),
            };
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

    // Load from SQLite on mount
    useEffect(() => {
        (async () => {
            const [subs, incomes, categories, spendingHistory] = await Promise.all([
                repo.getAllSubs(),
                repo.getAllIncomes(),
                repo.getAllCategories(),
                repo.getSpendingHistory(),
            ]);
            dispatch({ type: 'LOAD_DATA', subs, incomes, categories, spendingHistory });
            migrateSettingsFromSQLite();
        })();
    }, []);

    // Write-through helpers
    const addSub = useCallback((sub: Sub) => {
        dispatch({ type: 'ADD_SUB', sub });
        repo.insertSub(sub);
        repo.insertEvent({
            id: `evt_${sub.id}_${Date.now()}`,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            type: 'added',
            timestamp: Date.now(),
            metadata: JSON.stringify({ cost: sub.cost, cycle: sub.cycle }),
        });
    }, []);

    const updateSub = useCallback((sub: Sub) => {
        const old = state.subs.find(s => s.id === sub.id);
        dispatch({ type: 'UPDATE_SUB', sub });
        repo.updateSub(sub);
        if (old) {
            if (old.cost !== sub.cost) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_price`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'price_change',
                    timestamp: Date.now(),
                    metadata: JSON.stringify({ oldCost: old.cost, newCost: sub.cost, cycle: sub.cycle }),
                });
            }
            if (old.cycle !== sub.cycle) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_cycle`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'cycle_change',
                    timestamp: Date.now(),
                    metadata: JSON.stringify({ oldCycle: old.cycle, newCycle: sub.cycle, cost: sub.cost }),
                });
            }
            if (old.active && !sub.active) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_cancel`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'cancelled',
                    timestamp: Date.now(),
                    metadata: null,
                });
            }
            if (!old.active && sub.active) {
                repo.insertEvent({
                    id: `evt_${sub.id}_${Date.now()}_reactivate`,
                    subscriptionId: sub.id,
                    subscriptionName: sub.name,
                    type: 'reactivated',
                    timestamp: Date.now(),
                    metadata: null,
                });
            }
        }
    }, [state.subs]);

    const removeSub = useCallback((id: string) => {
        const sub = state.subs.find(s => s.id === id);
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
            });
        }
        dispatch({ type: 'REMOVE_SUB', id });
        repo.deleteSub(id);
    }, [state.subs]);

    const addIncome = useCallback((income: Income) => {
        dispatch({ type: 'ADD_INCOME', income });
        repo.insertIncome(income);
    }, []);

    const updateIncome = useCallback((income: Income) => {
        dispatch({ type: 'UPDATE_INCOME', income });
        repo.updateIncome(income);
    }, []);

    const removeIncome = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_INCOME', id });
        repo.deleteIncome(id);
    }, []);

    const reorderSubs = useCallback((ids: string[]) => {
        dispatch({ type: 'REORDER_SUBS', ids });
        repo.reorderSubs(ids);
    }, []);

    const decideTrial = useCallback((id: string, decision: 'kept' | 'cancelled') => {
        dispatch({ type: 'DECIDE_TRIAL', id, decision });
        // Write-through: update the sub in SQLite
        const sub = state.subs.find(s => s.id === id);
        if (sub) {
            const updated = decision === 'kept'
                ? { ...sub, isTrial: false, trialDecision: 'kept', active: true }
                : { ...sub, isTrial: false, trialDecision: 'cancelled', active: false };
            repo.updateSub(updated);
            repo.insertEvent({
                id: `evt_${id}_${Date.now()}_trial`,
                subscriptionId: id,
                subscriptionName: sub.name,
                type: decision === 'kept' ? 'reactivated' : 'cancelled',
                timestamp: Date.now(),
                metadata: JSON.stringify({ fromTrial: true }),
            });
        }
    }, [state.subs]);

    const addCategory = useCallback((category: Category) => {
        dispatch({ type: 'ADD_CATEGORY', category });
        repo.upsertCategory(category);
    }, []);

    const updateCategory = useCallback((category: Category) => {
        dispatch({ type: 'UPDATE_CATEGORY', category });
        repo.upsertCategory(category);
    }, []);

    const removeCategory = useCallback((id: string, reassignTo: string) => {
        dispatch({ type: 'REMOVE_CATEGORY', id, reassignTo });
        repo.deleteCategory(id);
        // Reassign subs in SQLite
        (async () => {
            const db = await (await import('./db')).getDb();
            await db.runAsync('UPDATE subscriptions SET category_id=? WHERE category_id=?', reassignTo, id);
        })();
    }, []);

    const reorderCategories = useCallback((ids: string[]) => {
        dispatch({ type: 'REORDER_CATEGORIES', ids });
        repo.reorderCategories(ids);
    }, []);

    const recordSnapshot = useCallback(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const activeSubs = state.subs.filter(s => s.active && !s.isTrial);
        const { subMo } = require('@/utils/calc');
        const totalMonthlyCost = activeSubs.reduce((sum: number, s: Sub) => sum + subMo(s), 0);
        const categoryBreakdown: Record<string, number> = {};
        activeSubs.forEach(s => {
            categoryBreakdown[s.categoryId] = (categoryBreakdown[s.categoryId] || 0) + subMo(s);
        });
        const snapshot: SpendingSnapshot = {
            id: `snap_${year}_${month}`,
            month,
            year,
            totalMonthlyCost,
            categoryBreakdown,
            subscriptionCount: activeSubs.length,
        };
        repo.recordMonthlySnapshot(snapshot);
        repo.getSpendingHistory().then(history => {
            dispatch({ type: 'SET_SPENDING_HISTORY', history });
        });
    }, [state.subs]);

    return (
        <StoreCtx.Provider value={{
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
        }}>
            {children}
        </StoreCtx.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreCtx);
    if (!ctx) throw new Error('useStore must be inside StoreProvider');
    return ctx;
}
