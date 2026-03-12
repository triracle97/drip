import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import * as repo from './repository';

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
    trialEndDay: number;
    trialDecision: string;
    color: string;
    customNum?: number;
    customUnit?: string;
    reminderDays: number | null;
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
    notificationsEnabled: boolean;
    notificationTime: string;
    isLoaded: boolean;
};

type Action =
    | { type: 'LOAD_DATA'; subs: Sub[]; incomes: Income[]; categories: Category[]; spendingHistory: SpendingSnapshot[]; notificationsEnabled: boolean; notificationTime: string }
    | { type: 'ADD_SUB'; sub: Sub }
    | { type: 'UPDATE_SUB'; sub: Sub }
    | { type: 'REMOVE_SUB'; id: string }
    | { type: 'ADD_INCOME'; income: Income }
    | { type: 'UPDATE_INCOME'; income: Income }
    | { type: 'REMOVE_INCOME'; id: string }
    | { type: 'DECIDE_TRIAL'; id: string; decision: 'kept' | 'cancelled' }
    | { type: 'ADD_CATEGORY'; category: Category }
    | { type: 'UPDATE_CATEGORY'; category: Category }
    | { type: 'REMOVE_CATEGORY'; id: string; reassignTo: string }
    | { type: 'REORDER_CATEGORIES'; ids: string[] }
    | { type: 'SET_SPENDING_HISTORY'; history: SpendingSnapshot[] }
    | { type: 'SET_NOTIFICATIONS_ENABLED'; enabled: boolean }
    | { type: 'SET_NOTIFICATION_TIME'; time: string };

const INIT_STATE: State = {
    subs: [],
    incomes: [],
    categories: [],
    spendingHistory: [],
    notificationsEnabled: false,
    notificationTime: '08:00',
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
                notificationsEnabled: action.notificationsEnabled,
                notificationTime: action.notificationTime,
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
        case 'SET_NOTIFICATIONS_ENABLED':
            return { ...state, notificationsEnabled: action.enabled };
        case 'SET_NOTIFICATION_TIME':
            return { ...state, notificationTime: action.time };
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
    notificationsEnabled: boolean;
    notificationTime: string;
    isLoaded: boolean;
    addSub: (s: Sub) => void;
    updateSub: (s: Sub) => void;
    removeSub: (id: string) => void;
    addIncome: (i: Income) => void;
    updateIncome: (i: Income) => void;
    removeIncome: (id: string) => void;
    decideTrial: (id: string, decision: 'kept' | 'cancelled') => void;
    addCategory: (c: Category) => void;
    updateCategory: (c: Category) => void;
    removeCategory: (id: string, reassignTo: string) => void;
    reorderCategories: (ids: string[]) => void;
    recordSnapshot: () => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setNotificationTime: (time: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, INIT_STATE);

    // Load from SQLite on mount
    useEffect(() => {
        (async () => {
            const [subs, incomes, categories, spendingHistory, settings] = await Promise.all([
                repo.getAllSubs(),
                repo.getAllIncomes(),
                repo.getAllCategories(),
                repo.getSpendingHistory(),
                repo.getAllSettings(),
            ]);
            dispatch({
                type: 'LOAD_DATA', subs, incomes, categories, spendingHistory,
                notificationsEnabled: settings.notificationsEnabled === 'true',
                notificationTime: settings.notificationTime || '08:00',
            });
        })();
    }, []);

    // Write-through helpers
    const addSub = useCallback((sub: Sub) => {
        dispatch({ type: 'ADD_SUB', sub });
        repo.insertSub(sub);
    }, []);

    const updateSub = useCallback((sub: Sub) => {
        dispatch({ type: 'UPDATE_SUB', sub });
        repo.updateSub(sub);
    }, []);

    const removeSub = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_SUB', id });
        repo.deleteSub(id);
    }, []);

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

    const decideTrial = useCallback((id: string, decision: 'kept' | 'cancelled') => {
        dispatch({ type: 'DECIDE_TRIAL', id, decision });
        // Write-through: update the sub in SQLite
        const sub = state.subs.find(s => s.id === id);
        if (sub) {
            const updated = decision === 'kept'
                ? { ...sub, isTrial: false, trialDecision: 'kept', active: true }
                : { ...sub, isTrial: false, trialDecision: 'cancelled', active: false };
            repo.updateSub(updated);
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

    const setNotificationsEnabled = useCallback((enabled: boolean) => {
        dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', enabled });
        repo.setSetting('notificationsEnabled', String(enabled));
    }, []);

    const setNotificationTime = useCallback((time: string) => {
        dispatch({ type: 'SET_NOTIFICATION_TIME', time });
        repo.setSetting('notificationTime', time);
    }, []);

    return (
        <StoreCtx.Provider value={{
            subs: state.subs,
            incomes: state.incomes,
            categories: state.categories,
            spendingHistory: state.spendingHistory,
            notificationsEnabled: state.notificationsEnabled,
            notificationTime: state.notificationTime,
            isLoaded: state.isLoaded,
            addSub, updateSub, removeSub,
            addIncome, updateIncome, removeIncome,
            decideTrial,
            addCategory, updateCategory, removeCategory, reorderCategories,
            recordSnapshot,
            setNotificationsEnabled, setNotificationTime,
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
