/**
 * Pure helpers for the onboarding flow (subscription pick → income → reveal → paywall).
 */
import type { Income } from '@/store';
import { blended, moEq } from '@/utils/calc';

export interface PickedSub {
  cost: number;
  cycle: string;
}

/** Monthly take-home → the Income record the rest of the app expects (salary, 40h/week). */
export function incomeFromMonthly(monthly: number): Income {
  return {
    id: `i${Date.now()}`,
    label: 'Salary',
    amount: monthly * 12,
    isHourly: false,
    hoursPerWeek: 40,
  };
}

/** Hourly rate implied by a monthly income (0 when unknown). */
export function hourlyFromMonthly(monthly: number): number {
  if (!(monthly > 0)) return 0;
  return blended([incomeFromMonthly(monthly)]);
}

export interface RevealStats {
  count: number;
  monthlyCost: number;
  rate: number;
  /** Work hours per month needed to pay for the picked subscriptions (0 if no income). */
  hoursPerMonth: number;
  hoursPerYear: number;
  /** % of monthly income (0 if no income). */
  pctIncome: number;
}

export function revealStats(picked: PickedSub[], monthlyIncome: number): RevealStats {
  const monthlyCost = picked.reduce((sum, p) => sum + moEq(p.cost, p.cycle), 0);
  const rate = hourlyFromMonthly(monthlyIncome);
  const hoursPerMonth = rate > 0 ? monthlyCost / rate : 0;
  return {
    count: picked.length,
    monthlyCost,
    rate,
    hoursPerMonth,
    hoursPerYear: hoursPerMonth * 12,
    pctIncome: monthlyIncome > 0 ? (monthlyCost / monthlyIncome) * 100 : 0,
  };
}

/**
 * Minutes of work Drip's yearly plan costs per month, for the paywall line
 * "Drip costs you 10 min of work a month". Only meaningful when the store price
 * and the user's income are in the same currency.
 */
export function dripMinutesPerMonth(
  yearlyPrice: number | null | undefined,
  storeCurrency: string | null | undefined,
  appCurrency: string,
  rate: number,
): number | null {
  if (!yearlyPrice || !(rate > 0)) return null;
  if (!storeCurrency || storeCurrency.toUpperCase() !== appCurrency.toUpperCase()) return null;
  const minutes = Math.round(((yearlyPrice / 12) / rate) * 60);
  return Math.max(1, minutes);
}
