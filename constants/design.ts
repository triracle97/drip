/**
 * Drip Design System — Robinhood-inspired tokens
 * Stark · Data-forward · Zero decoration · Numbers as heroes
 */

// ─── COLORS ────────────────────────────────
export const C = {
    bg: '#FFFFFF',
    bgSub: '#F5F5F5',
    surface: '#FAFAFA',
    surfaceElevated: '#FFFFFF',
    black: '#000000',
    t1: '#000000',
    t2: '#6B6B6B',
    t3: '#ABABAB',
    line: 'rgba(0,0,0,0.08)',
    overlay: 'rgba(0,0,0,0.5)',
    green: '#34C759',
    accent: '#34C759',
    greenBg: 'rgba(52,199,89,0.08)',
    greenLine: 'rgba(52,199,89,0.20)',
    red: '#FF3B30',
    redBg: 'rgba(255,59,48,0.08)',
    redLine: 'rgba(255,59,48,0.24)',
    gold: '#F5A623',
    warningBg: 'rgba(245,166,35,0.08)',
    catTint: {
        entertainment: 'rgba(87,126,137,0.04)',
        productivity: 'rgba(225,163,111,0.04)',
        health: 'rgba(91,164,164,0.04)',
        finance: 'rgba(222,196,132,0.04)',
        education: 'rgba(139,123,163,0.04)',
        other: 'rgba(142,142,147,0.04)',
    },
} as const;

// ─── TYPOGRAPHY ────────────────────────────
// Font families (system fonts for native feel)
export const FF = {
    display: undefined as string | undefined, // SF Pro Display — system default on iOS
    text: undefined as string | undefined, // SF Pro Text — system default on iOS
};

// Type scale
export const TS = {
    hero1: { fontSize: 48, fontWeight: '800', lineHeight: 48 * 1.05, letterSpacing: -1.5 },
    hero2: { fontSize: 32, fontWeight: '700', lineHeight: 32 * 1.1, letterSpacing: -1 },
    title: { fontSize: 22, fontWeight: '700', lineHeight: 22 * 1.2, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, fontWeight: '600', lineHeight: 16 * 1.4, letterSpacing: -0.2 },
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
    sm: 8,
    md: 16,
    lg: 24,
    pill: 999,
} as const;

// ─── SHADOWS ──────────────────────────────
export const SHADOW = {
    none: {},
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHover: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 6,
    },
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
    screenHPad: 16,
    tabBarHeight: 80,
    statusHeight: 56,
    bottomSafe: 40,
} as const;
