import React, { createContext, useCallback, useContext, useReducer } from 'react';

// ─── DATA TYPES ───────────────────────────
export interface Sub {
    id: string;
    name: string;
    icon: string;
    cost: number;
    cycle: string;
    category: string;
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

export interface Income {
    id: string;
    label: string;
    amount: number;
    isHourly: boolean;
    hoursPerWeek: number;
}

// ─── INITIAL DATA ─────────────────────────
const today = new Date();
const curDay = today.getDate();

export const INIT_SUBS: Sub[] = [
    { id: 's1', name: 'Netflix', icon: '▶️', cost: 15.99, cycle: 'monthly', category: 'entertainment', active: true, billDay: 12, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#E50914' },
    { id: 's2', name: 'Spotify', icon: '🎵', cost: 10.99, cycle: 'monthly', category: 'entertainment', active: true, billDay: 8, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#1DB954' },
    { id: 's3', name: 'iCloud+', icon: '☁️', cost: 2.99, cycle: 'monthly', category: 'productivity', active: true, billDay: 15, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#3693F5' },
    { id: 's4', name: 'GitHub Pro', icon: '⌨️', cost: 4, cycle: 'monthly', category: 'productivity', active: true, billDay: 20, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#24292e' },
    { id: 's5', name: 'ChatGPT Plus', icon: '🧠', cost: 20, cycle: 'monthly', category: 'productivity', active: true, billDay: 5, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#10A37F' },
    { id: 's6', name: 'YouTube Premium', icon: '📺', cost: 13.99, cycle: 'monthly', category: 'entertainment', active: true, billDay: 18, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#FF0000' },
    { id: 's7', name: 'Figma Pro', icon: '✏️', cost: 12, cycle: 'monthly', category: 'productivity', active: true, billDay: 25, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#A259FF' },
    { id: 's8', name: 'Adobe CC', icon: '🎬', cost: 54.99, cycle: 'monthly', category: 'productivity', active: false, billDay: 1, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#FF0000' },
    { id: 's9', name: 'Gym', icon: '🏋️', cost: 49.99, cycle: 'monthly', category: 'health', active: true, billDay: 1, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#4ECB71' },
    { id: 's10', name: 'Apple Dev', icon: '📱', cost: 99, cycle: 'yearly', category: 'productivity', active: true, billDay: 15, isTrial: false, trialEndDay: 0, trialDecision: 'none', color: '#000000' },
    { id: 's11', name: 'Cursor Pro', icon: '💻', cost: 20, cycle: 'monthly', category: 'productivity', active: true, billDay: 10, isTrial: true, trialEndDay: curDay + 7, trialDecision: 'pending', color: '#5B8DEF' },
    { id: 's12', name: 'Notion AI', icon: '📊', cost: 8, cycle: 'monthly', category: 'productivity', active: true, billDay: 22, isTrial: true, trialEndDay: curDay + 3, trialDecision: 'pending', color: '#24292e' },
];

export const INIT_INCOME: Income[] = [
    { id: 'i1', label: 'Full-time salary', amount: 85000, isHourly: false, hoursPerWeek: 40 },
    { id: 'i2', label: 'Freelance dev', amount: 75, isHourly: true, hoursPerWeek: 10 },
];

// ─── STATE & ACTIONS ──────────────────────
type State = {
    subs: Sub[];
    incomes: Income[];
};

type Action =
    | { type: 'ADD_SUB'; sub: Sub }
    | { type: 'UPDATE_SUB'; sub: Sub }
    | { type: 'REMOVE_SUB'; id: string }
    | { type: 'ADD_INCOME'; income: Income }
    | { type: 'UPDATE_INCOME'; income: Income }
    | { type: 'REMOVE_INCOME'; id: string }
    | { type: 'DECIDE_TRIAL'; id: string; decision: 'kept' | 'cancelled' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
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
        default:
            return state;
    }
}

// ─── CONTEXT ──────────────────────────────
type Ctx = {
    subs: Sub[];
    incomes: Income[];
    addSub: (s: Sub) => void;
    updateSub: (s: Sub) => void;
    removeSub: (id: string) => void;
    addIncome: (i: Income) => void;
    updateIncome: (i: Income) => void;
    removeIncome: (id: string) => void;
    decideTrial: (id: string, decision: 'kept' | 'cancelled') => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, { subs: INIT_SUBS, incomes: INIT_INCOME });

    const addSub = useCallback((sub: Sub) => dispatch({ type: 'ADD_SUB', sub }), []);
    const updateSub = useCallback((sub: Sub) => dispatch({ type: 'UPDATE_SUB', sub }), []);
    const removeSub = useCallback((id: string) => dispatch({ type: 'REMOVE_SUB', id }), []);
    const addIncome = useCallback((income: Income) => dispatch({ type: 'ADD_INCOME', income }), []);
    const updateIncome = useCallback((income: Income) => dispatch({ type: 'UPDATE_INCOME', income }), []);
    const removeIncome = useCallback((id: string) => dispatch({ type: 'REMOVE_INCOME', id }), []);
    const decideTrial = useCallback((id: string, decision: 'kept' | 'cancelled') =>
        dispatch({ type: 'DECIDE_TRIAL', id, decision }), []);

    return (
        <StoreCtx.Provider value={{ subs: state.subs, incomes: state.incomes, addSub, updateSub, removeSub, addIncome, updateIncome, removeIncome, decideTrial }}>
            {children}
        </StoreCtx.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreCtx);
    if (!ctx) throw new Error('useStore must be inside StoreProvider');
    return ctx;
}
