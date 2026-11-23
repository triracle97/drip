import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockAddSub = jest.fn();
const mockAddIncome = jest.fn();
jest.mock('@/store', () => ({
  useStore: () => ({ addSub: mockAddSub, addIncome: mockAddIncome, subs: [] }),
}));

import Onboarding from '@/components/onboarding/Onboarding';
import { useSettings } from '@/store/settings';
import * as Notifications from 'expo-notifications';

const N = Notifications as any;

beforeEach(() => {
  jest.clearAllMocks();
  useSettings.setState({ hasOnboarded: false, currency: 'USD', notificationsEnabled: false, language: 'en' });
});

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

it('pick → income → reveal → reminders adds subs, income and finishes', async () => {
  render(<Onboarding />);
  await flush();
  fireEvent.press(screen.getByTestId('onb-start'));

  // Pick Netflix ($15.99) + Spotify ($10.99)
  fireEvent.press(screen.getByTestId('pick-Netflix'));
  fireEvent.press(screen.getByTestId('pick-Spotify'));
  expect(screen.getByText('2 selected · $26.98/mo')).toBeTruthy();
  fireEvent.press(screen.getByTestId('onb-pick-next'));

  // $2,600 / month = $15/h
  fireEvent.changeText(screen.getByTestId('onb-income-input'), '2600');
  expect(screen.getByText('= $15.00 per hour')).toBeTruthy();
  fireEvent.press(screen.getByTestId('onb-income-next'));

  // Reveal: $26.98 / $15 = 1h 48m; 21.6h a year ≈ 3 working days
  expect(screen.getByText('EVERY MONTH YOU WORK')).toBeTruthy();
  expect(screen.getByLabelText('1h 48m')).toBeTruthy();
  expect(screen.getByText('just to pay for 2 subscriptions')).toBeTruthy();
  expect(screen.getByText("That's 22 hours a year — 3 working days.")).toBeTruthy();
  fireEvent.press(screen.getByTestId('onb-reveal-next'));

  // Reminders → grant permission
  expect(screen.getByText('Never get charged by surprise.')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('onb-reminders-yes'));
  });
  await flush();

  expect(N.requestPermissionsAsync).not.toHaveBeenCalled(); // already granted in mock
  expect(mockAddIncome).toHaveBeenCalledTimes(1);
  expect(mockAddIncome.mock.calls[0][0]).toMatchObject({ amount: 31200, isHourly: false, hoursPerWeek: 40 });
  expect(mockAddSub).toHaveBeenCalledTimes(2);
  expect(mockAddSub.mock.calls.map((c) => c[0].name)).toEqual(['Netflix', 'Spotify']);
  expect(mockAddSub.mock.calls[0][0]).toMatchObject({ cost: 15.99, active: true, reminderDays: 1 });
  expect(useSettings.getState().notificationsEnabled).toBe(true);
  expect(useSettings.getState().hasOnboarded).toBe(true);
});

it('skipping everything still finishes without adding data', async () => {
  render(<Onboarding />);
  await flush();
  fireEvent.press(screen.getByTestId('onb-start'));
  fireEvent.press(screen.getByTestId('onb-pick-next')); // "Skip" with nothing picked
  fireEvent.press(screen.getByTestId('onb-income-skip'));
  // Reveal is skipped when nothing was picked → straight to reminders
  expect(screen.getByText('Never get charged by surprise.')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('onb-reminders-no'));
  });
  await flush();
  expect(mockAddSub).not.toHaveBeenCalled();
  expect(mockAddIncome).not.toHaveBeenCalled();
  expect(useSettings.getState().hasOnboarded).toBe(true);
});

it('converts default prices to the chosen currency', async () => {
  useSettings.setState({ currency: 'EUR' });
  render(<Onboarding />);
  await flush();
  fireEvent.press(screen.getByTestId('onb-start'));
  fireEvent.press(screen.getByTestId('pick-Netflix'));
  expect(screen.getByText(/1 selected · €14,99\/mo/)).toBeTruthy();
});

it('going back and forth does not duplicate subscriptions', async () => {
  render(<Onboarding />);
  await flush();
  fireEvent.press(screen.getByTestId('onb-start'));
  fireEvent.press(screen.getByTestId('pick-Netflix'));
  fireEvent.press(screen.getByTestId('onb-pick-next'));
  fireEvent.press(screen.getByLabelText('Back'));
  fireEvent.press(screen.getByTestId('onb-pick-next'));
  fireEvent.press(screen.getByTestId('onb-income-skip'));
  fireEvent.press(screen.getByTestId('onb-reveal-next'));
  await act(async () => {
    fireEvent.press(screen.getByTestId('onb-reminders-no'));
  });
  await flush();
  expect(mockAddSub).toHaveBeenCalledTimes(1);
});

it('year equivalent agrees with the rounded hours (39.98h → "a full work week")', () => {
  const { yearEquivalent } = require('@/components/onboarding/Onboarding');
  const t = require('@/i18n').default.t;
  expect(yearEquivalent(t, 39.98)).toBe('a full work week');
  expect(yearEquivalent(t, 21.6)).toBe('3 working days');
  expect(yearEquivalent(t, 85)).toBe('2 full work weeks');
  expect(yearEquivalent(t, 3)).toBe('a full working day');
});
