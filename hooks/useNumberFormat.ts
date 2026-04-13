import { resolveLanguage } from '@/i18n';
import { useSettings } from '@/store/settings';
import { useCallback, useMemo } from 'react';

/**
 * Hook that provides locale-aware number formatting and parsing.
 * Groups digits with the appropriate separator based on the app language.
 * e.g. English: 1,000,000  |  Vietnamese: 1.000.000
 */
export function useNumberFormat() {
    const language = useSettings((s) => s.language);
    const lang = useMemo(() => resolveLanguage(language), [language]);

    // Languages that use "." as grouping and "," as decimal
    const usesDotGrouping = lang === 'vi' || lang === 'es';
    const groupSep = usesDotGrouping ? '.' : ',';
    const decimalSep = usesDotGrouping ? ',' : '.';

    const formatNumber = useCallback((raw: string) => {
        if (!raw) return '';
        const hasDecimal = raw.includes('.');
        const [intPart, decPart] = raw.split('.');
        const num = parseInt(intPart, 10);
        if (isNaN(num)) return raw;
        const str = Math.abs(num).toString();
        const grouped = str.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
        const prefix = num < 0 ? '-' : '';
        if (hasDecimal) return `${prefix}${grouped}${decimalSep}${decPart ?? ''}`;
        return `${prefix}${grouped}`;
    }, [groupSep, decimalSep]);

    const parseFormatted = useCallback((text: string) => {
        // Strip grouping separators, normalize decimal separator to "."
        let cleaned = text.split(groupSep).join('');
        if (decimalSep !== '.') {
            cleaned = cleaned.replace(decimalSep, '.');
        }
        // Only allow digits and one dot
        cleaned = cleaned.replace(/[^0-9.]/g, '');
        // Prevent multiple dots
        const dotIdx = cleaned.indexOf('.');
        if (dotIdx !== -1) {
            cleaned = cleaned.slice(0, dotIdx + 1) + cleaned.slice(dotIdx + 1).replace(/\./g, '');
        }
        return cleaned;
    }, [groupSep, decimalSep]);

    return { formatNumber, parseFormatted, groupSep, decimalSep };
}
