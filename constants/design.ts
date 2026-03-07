/**
 * Drip Design System — Robinhood-inspired tokens
 * Stark · Data-forward · Zero decoration · Numbers as heroes
 */

// ─── COLORS ────────────────────────────────
export const C = {
    bg: '#FFFFFF',
    bgSub: '#F5F5F5',
    black: '#000000',
    t1: '#000000',
    t2: '#6B6B6B',
    t3: '#ABABAB',
    line: 'rgba(0,0,0,0.08)',
    green: '#00C805',
    greenBg: 'rgba(0,200,5,0.08)',
    greenLine: 'rgba(0,200,5,0.24)',
    red: '#FF3B30',
    redBg: 'rgba(255,59,48,0.08)',
    redLine: 'rgba(255,59,48,0.24)',
    gold: '#F5A623',
} as const;

// ─── TYPOGRAPHY ────────────────────────────
// Font families (system fonts for native feel)
export const FF = {
    display: undefined as string | undefined, // SF Pro Display — system default on iOS
    text: undefined as string | undefined, // SF Pro Text — system default on iOS
};

// Type scale
export const TS = {
    hero1: { fontSize: 64, fontWeight: '700', lineHeight: 64 * 1.0, letterSpacing: -2 },
    hero2: { fontSize: 40, fontWeight: '700', lineHeight: 40 * 1.05, letterSpacing: -1.5 },
    title: { fontSize: 22, fontWeight: '700', lineHeight: 22 * 1.2, letterSpacing: -0.5 },
    body1: { fontSize: 16, fontWeight: '500', lineHeight: 16 * 1.5, letterSpacing: 0 },
    body2: { fontSize: 14, fontWeight: '400', lineHeight: 14 * 1.5, letterSpacing: 0 },
    label: { fontSize: 13, fontWeight: '500', lineHeight: 13 * 1.4, letterSpacing: 0 },
    cap: { fontSize: 11, fontWeight: '500', lineHeight: 11 * 1.3, letterSpacing: 0.5 },
    micro: { fontSize: 10, fontWeight: '500', lineHeight: 10 * 1.2, letterSpacing: 0.2 },
} as const;

// ─── SPACING (8pt grid) ────────────────────
export const SP = {
    1: 4,
    2: 8,
    3: 16,
    4: 24,
    5: 32,
    6: 48,
    7: 64,
} as const;

// ─── BORDER RADIUS ─────────────────────────
export const R = {
    none: 0,
    sm: 6,
    md: 12,
    pill: 999,
} as const;

// ─── SHADOWS ──────────────────────────────
export const SHADOW = {
    none: {},
    sheet: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
        elevation: 2,
    },
    fab: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;

// ─── ANIMATION DURATIONS ───────────────────
export const DUR = {
    instant: 100,
    fast: 200,
    normal: 300,
    counter: 600,
} as const;

// ─── LAYOUT ───────────────────────────────
export const LAYOUT = {
    screenHPad: 24,
    tabBarHeight: 80,
    statusHeight: 56,
    bottomSafe: 40,
} as const;
