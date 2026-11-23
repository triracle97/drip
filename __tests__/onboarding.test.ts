import { dripMinutesPerMonth, hourlyFromMonthly, revealStats } from '@/lib/onboarding';

describe('onboarding reveal', () => {
  it('$2,600/month = $15/hour (40h weeks)', () => {
    expect(hourlyFromMonthly(2600)).toBeCloseTo(15, 5);
    expect(hourlyFromMonthly(0)).toBe(0);
    expect(hourlyFromMonthly(NaN)).toBe(0);
  });

  it('computes monthly cost, hours and % of income', () => {
    const s = revealStats(
      [
        { cost: 15.49, cycle: 'monthly' },
        { cost: 11.99, cycle: 'monthly' },
        { cost: 20, cycle: 'monthly' },
        { cost: 2.99, cycle: 'monthly' },
      ],
      2600,
    );
    expect(s.count).toBe(4);
    expect(s.monthlyCost).toBeCloseTo(50.47, 2);
    expect(s.hoursPerMonth).toBeCloseTo(3.3647, 3); // 3h 22m
    expect(s.hoursPerYear).toBeCloseTo(40.37, 1);
    expect(s.pctIncome).toBeCloseTo(1.94, 2);
  });

  it('normalizes yearly prices to monthly', () => {
    expect(revealStats([{ cost: 120, cycle: 'yearly' }], 2600).monthlyCost).toBe(10);
  });

  it('no income → no hours', () => {
    const s = revealStats([{ cost: 10, cycle: 'monthly' }], 0);
    expect(s.hoursPerMonth).toBe(0);
    expect(s.pctIncome).toBe(0);
  });
});

describe('dripMinutesPerMonth', () => {
  it('$30/year at $15/h = 10 min a month', () => {
    expect(dripMinutesPerMonth(30, 'USD', 'USD', 15)).toBe(10);
  });
  it('hidden when currencies differ or no income', () => {
    expect(dripMinutesPerMonth(30, 'USD', 'JPY', 15)).toBeNull();
    expect(dripMinutesPerMonth(30, 'USD', 'USD', 0)).toBeNull();
    expect(dripMinutesPerMonth(null, 'USD', 'USD', 15)).toBeNull();
  });
  it('never shows 0 min', () => {
    expect(dripMinutesPerMonth(30, 'usd', 'USD', 10000)).toBe(1);
  });
});
