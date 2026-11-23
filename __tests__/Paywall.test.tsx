import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import Purchases from 'react-native-purchases';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
const mockIncomes: any[] = [];
jest.mock('@/store', () => ({ useStore: () => ({ incomes: mockIncomes }) }));

const P = Purchases as any;

const intro = { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3, period: 'P3D', cycles: 1, priceString: '$0' };
const monthly = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'drip_pro_monthly', price: 2.99, priceString: '$2.99', currencyCode: 'USD', subscriptionPeriod: 'P1M', introPrice: intro } };
const annual = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'drip_pro_yearly', price: 14.99, priceString: '$14.99', currencyCode: 'USD', subscriptionPeriod: 'P1Y', pricePerMonthString: '$1.25', introPrice: intro } };

import Paywall from '@/components/Paywall';
import { usePurchases, __resetPurchasesForTests } from '@/store/purchases';
import { useSettings } from '@/store/settings';
import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

function setOffering(trialEligible: Record<string, boolean> = { drip_pro_monthly: true, drip_pro_yearly: true }) {
  usePurchases.setState({
    configured: true,
    ready: true,
    offering: { identifier: 'default', availablePackages: [monthly, annual], monthly, annual } as any,
    offeringStatus: 'loaded',
    trialEligible,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  __resetPurchasesForTests();
  useSettings.setState({ isPro: false, accessKind: 'none' });
});

it('shows the 3-day trial offer with yearly preselected and a 58% saving', () => {
  setOffering();
  render(<Paywall />);
  expect(screen.getByText('Start your 3-day free trial')).toBeTruthy();
  expect(screen.getByText('Start my 3-day free trial')).toBeTruthy();
  expect(screen.getByText('No payment due now')).toBeTruthy();
  expect(screen.getByText('Full access to everything')).toBeTruthy();
  expect(screen.getByText("We'll remind you before your trial ends")).toBeTruthy();
  expect(screen.getByText('Your plan starts at $14.99/year. Cancel anytime before.')).toBeTruthy();
  expect(screen.getByText('$14.99/year')).toBeTruthy();
  expect(screen.getByText('$2.99/month')).toBeTruthy();
  expect(screen.getByText('SAVE 58%')).toBeTruthy();
  expect(screen.getByText('Just $1.25/month')).toBeTruthy();
  expect(screen.getByText(/Free for 3 days, then \$14.99\/year\. Auto-renews/)).toBeTruthy();
});

it('purchases the selected plan', async () => {
  setOffering();
  P.purchasePackage.mockResolvedValue({
    customerInfo: {
      entitlements: { active: { pro: { isActive: true, periodType: 'TRIAL', expirationDate: '2099-01-01', willRenew: true, productIdentifier: 'drip_pro_monthly' } }, all: {} },
      nonSubscriptionTransactions: [],
      allPurchasedProductIdentifiers: [],
    },
  });
  render(<Paywall />);
  fireEvent.press(screen.getByTestId('plan-monthly'));
  expect(screen.getByText(/then \$2.99\/month/)).toBeTruthy();
  fireEvent.press(screen.getByTestId('paywall-cta'));
  await waitFor(() => expect(P.purchasePackage).toHaveBeenCalledWith(monthly));
  await waitFor(() => expect(usePurchases.getState().access.kind).toBe('trial'));
});

it('hides the trial for users who already used it', () => {
  setOffering({ drip_pro_monthly: false, drip_pro_yearly: false });
  render(<Paywall />);
  expect(screen.queryByText(/free trial/i)).toBeNull();
  expect(screen.queryByText('No payment due now')).toBeNull();
  expect(screen.getByText('Continue')).toBeTruthy();
  expect(screen.getByText('Unlock Drip Pro')).toBeTruthy();
});

it('only shows plans that exist in the store and buys exactly that one', async () => {
  usePurchases.setState({
    configured: true,
    ready: true,
    offering: { identifier: 'default', availablePackages: [annual], annual } as any,
    offeringStatus: 'loaded',
    trialEligible: { drip_pro_yearly: true },
  });
  P.purchasePackage.mockResolvedValue({ customerInfo: { entitlements: { active: {}, all: {} } } });
  render(<Paywall />);
  expect(screen.queryByTestId('plan-monthly')).toBeNull();
  fireEvent.press(screen.getByTestId('paywall-cta'));
  await waitFor(() => expect(P.purchasePackage).toHaveBeenCalledWith(annual));
});

it('shows a spinner instead of prices while plans load', () => {
  usePurchases.setState({ configured: true, ready: true, offering: null, offeringStatus: 'loading' });
  render(<Paywall />);
  expect(screen.queryByTestId('plan-annual')).toBeNull();
});

it('lapsed subscribers get welcome-back copy', () => {
  useSettings.setState({ accessKind: 'subscription' });
  setOffering({ drip_pro_monthly: false, drip_pro_yearly: false });
  render(<Paywall />);
  expect(screen.getByText('Welcome back to Drip')).toBeTruthy();
});

it('shows what Drip costs in work minutes when income is known (same currency)', () => {
  mockIncomes.splice(0, mockIncomes.length, { id: 'i', label: 'Salary', amount: 31200, isHourly: false, hoursPerWeek: 40 }); // $15/h
  useSettings.setState({ currency: 'USD' });
  setOffering();
  render(<Paywall />);
  expect(screen.getByText('Drip costs you 5 min of work a month')).toBeTruthy(); // $14.99/12 at $15/h
  mockIncomes.splice(0);
});

it('no trial copy when the store product has no free intro offer', () => {
  const noTrial = { ...annual, product: { ...annual.product, introPrice: null } };
  usePurchases.setState({
    configured: true, ready: true, offeringStatus: 'loaded', trialEligible: {},
    offering: { identifier: 'default', availablePackages: [noTrial], annual: noTrial } as any,
  });
  render(<Paywall />);
  expect(screen.queryByText(/free trial/i)).toBeNull();
  expect(screen.queryByText('No payment due now')).toBeNull();
  expect(screen.getByText('$14.99/year, auto-renews until cancelled. Cancel anytime in your store account settings at least 24 hours before renewal.')).toBeTruthy();
});

it('restore button calls RevenueCat', async () => {
  setOffering();
  P.restorePurchases.mockResolvedValue({ entitlements: { active: {}, all: {} }, nonSubscriptionTransactions: [], allPurchasedProductIdentifiers: [] });
  render(<Paywall />);
  fireEvent.press(screen.getByTestId('paywall-restore'));
  await waitFor(() => expect(P.restorePurchases).toHaveBeenCalled());
});

it('when plans cannot load: no prices or trial are invented, and it retries', async () => {
  usePurchases.setState({ configured: true, ready: true, offeringStatus: 'error' });
  P.getOfferings.mockRejectedValue(new Error('offline'));
  render(<Paywall />);
  expect(P.getCurrentOfferingForPlacement).toHaveBeenCalledWith('hard_paywall');
  expect(await screen.findByTestId('paywall-unavailable')).toBeTruthy();
  expect(screen.queryByText(/\$/)).toBeNull();
  expect(screen.queryByText(/free trial/i)).toBeNull();
  expect(screen.queryByText(/auto-renews/)).toBeNull();
  expect(screen.getByText('Unlock Drip Pro')).toBeTruthy();
});
