/**
 * Approximate USD exchange rates, used ONLY to turn the built-in default prices
 * of popular services (stored in USD) into a sensible starting price in the
 * user's currency. Users can edit every price; these are estimates, not quotes.
 * (Late-2026 ballpark values.)
 */
const USD_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150, CNY: 7.2, CHF: 0.88, CAD: 1.37, AUD: 1.52,
  NZD: 1.66, HKD: 7.8, SGD: 1.34, TWD: 32, KRW: 1350, VND: 25400, THB: 35, MYR: 4.5,
  IDR: 15800, PHP: 57, INR: 84, PKR: 280, BDT: 120, LKR: 300, AED: 3.67, SAR: 3.75,
  ILS: 3.7, TRY: 34, ZAR: 18, EGP: 49, NGN: 1600, KES: 129, BRL: 5.5, MXN: 18,
  ARS: 1000, CLP: 940, COP: 4100, PEN: 3.75, SEK: 10.6, NOK: 10.8, DKK: 6.9,
  PLN: 4, CZK: 23, HUF: 360, RON: 4.6, UAH: 41, RUB: 95,
};

/** Currencies normally priced without decimals. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'COP', 'HUF', 'PKR', 'NGN', 'ARS', 'TWD', 'LKR', 'KES']);

export function hasRate(code: string): boolean {
  return code.toUpperCase() in USD_RATES;
}

/**
 * Convert a USD default price to the given currency and round it to a
 * plausible local price point. Unknown currencies return the USD amount.
 */
export function localPrice(usd: number, code: string): number {
  const c = code.toUpperCase();
  const rate = USD_RATES[c];
  if (!rate || c === 'USD') return usd;
  const raw = usd * rate;
  if (ZERO_DECIMAL.has(c)) {
    // 2 significant-ish steps: ¥2,398 → ¥2,400, ₫406,000 → ₫406,000
    const step = raw >= 100000 ? 1000 : raw >= 10000 ? 100 : raw >= 1000 ? 10 : 1;
    return Math.round(raw / step) * step;
  }
  // Store-style .99 endings for decimal currencies.
  if (raw < 1) return Math.round(raw * 100) / 100;
  return Math.max(0.99, Math.round(raw) - 0.01);
}
