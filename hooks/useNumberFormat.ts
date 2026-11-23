import { resolveLanguage } from '@/i18n';
import { useSettings } from '@/store/settings';
import { useCallback, useMemo } from 'react';

export interface Separators {
    groupSep: string;
    decimalSep: string;
}

export function separatorsFor(lang: string): Separators {
    // Languages that use "." as grouping and "," as decimal
    const usesDotGrouping = lang === 'vi' || lang === 'es';
    return usesDotGrouping ? { groupSep: '.', decimalSep: ',' } : { groupSep: ',', decimalSep: '.' };
}

/** Canonical "1234.5" → display "1,234.5" / "1.234,5". */
export function formatNumberWith(raw: string, { groupSep, decimalSep }: Separators): string {
    if (!raw) return '';
    const hasDecimal = raw.includes('.');
    const [intPart, decPart] = raw.split('.');
    const num = intPart === '' || intPart === '-' ? 0 : parseInt(intPart, 10);
    if (isNaN(num)) return raw;
    const grouped = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
    const prefix = num < 0 || intPart === '-' ? '-' : '';
    return hasDecimal ? `${prefix}${grouped}${decimalSep}${decPart ?? ''}` : `${prefix}${grouped}`;
}

/**
 * Display text → canonical "1234.5".
 *
 * The decimal-pad key follows the DEVICE region, which can differ from the app
 * language (e.g. app in Vietnamese on a US-region phone types "."). So a
 * separator the user just typed at the end is always treated as the decimal
 * point, whichever character it is; existing group separators are dropped.
 */
export function parseFormattedWith(text: string, { decimalSep }: Separators): string {
    const t = text.replace(/[^0-9.,]/g, '');
    const last = Math.max(t.lastIndexOf('.'), t.lastIndexOf(','));
    if (last === -1) return t;
    const sep = t[last];
    const after = t.slice(last + 1);
    const isDecimal = sep === decimalSep || after.length === 0;
    if (!isDecimal) return t.replace(/[.,]/g, '');
    const intPart = t.slice(0, last).replace(/[.,]/g, '');
    return `${intPart}.${after}`;
}

/**
 * Hook that provides locale-aware number formatting and parsing.
 * Groups digits with the appropriate separator based on the app language.
 * e.g. English: 1,000,000  |  Vietnamese: 1.000.000
 */
export function useNumberFormat() {
    const language = useSettings((s) => s.language);
    const lang = useMemo(() => resolveLanguage(language), [language]);
    const seps = useMemo(() => separatorsFor(lang), [lang]);

    const formatNumber = useCallback((raw: string) => formatNumberWith(raw, seps), [seps]);
    const parseFormatted = useCallback((text: string) => parseFormattedWith(text, seps), [seps]);

    return { formatNumber, parseFormatted, groupSep: seps.groupSep, decimalSep: seps.decimalSep };
}
