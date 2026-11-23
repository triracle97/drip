/* eslint-disable no-undef */
// Global mocks for native modules used by the code under test.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US', decimalSeparator: '.', digitGroupingSeparator: ',' }],
}));

jest.mock('expo-notifications', () => {
  const scheduled: any[] = [];
  return {
    __scheduled: scheduled,
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(async () => null),
    getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => {
      scheduled.length = 0;
    }),
    scheduleNotificationAsync: jest.fn(async (req: any) => {
      scheduled.push(req);
      return `id-${scheduled.length}`;
    }),
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
  };
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('react-native-purchases', () => {
  const listeners: any[] = [];
  const Purchases = {
    __listeners: listeners,
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    setAttributes: jest.fn(async () => {}),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    getCurrentOfferingForPlacement: jest.fn(async () => null),
    enableAdServicesAttributionTokenCollection: jest.fn(async () => {}),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    showManageSubscriptions: jest.fn(async () => {}),
    checkTrialOrIntroductoryPriceEligibility: jest.fn(async () => ({})),
    addCustomerInfoUpdateListener: jest.fn((l: any) => listeners.push(l)),
    removeCustomerInfoUpdateListener: jest.fn(),
  };
  return {
    __esModule: true,
    default: Purchases,
    LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN' },
    STOREKIT_VERSION: { STOREKIT_2: 'STOREKIT_2' },
    INTRO_ELIGIBILITY_STATUS: {
      INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
      INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
      INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
      INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3,
    },
    PURCHASES_ERROR_CODE: {
      PURCHASE_CANCELLED_ERROR: '1',
      STORE_PROBLEM_ERROR: '2',
      PURCHASE_NOT_ALLOWED_ERROR: '3',
      PURCHASE_INVALID_ERROR: '4',
      PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: '5',
      PRODUCT_ALREADY_PURCHASED_ERROR: '6',
      RECEIPT_ALREADY_IN_USE_ERROR: '7',
      NETWORK_ERROR: '10',
      INSUFFICIENT_PERMISSIONS_ERROR: '14',
      PAYMENT_PENDING_ERROR: '15',
      OFFLINE_CONNECTION_ERROR: '35',
    },
  };
});

jest.mock('@amplitude/analytics-react-native', () => ({
  init: jest.fn(() => ({ promise: Promise.resolve() })),
  add: jest.fn(() => ({ promise: Promise.resolve() })),
  track: jest.fn(),
  setUserId: jest.fn(),
  identify: jest.fn(),
  getDeviceId: jest.fn(),
  getUserId: jest.fn(),
  Identify: jest.fn().mockImplementation(() => ({ set: jest.fn() })),
}));

jest.mock('@amplitude/plugin-session-replay-react-native', () => ({
  SessionReplayPlugin: jest.fn(),
}));

jest.mock('lottie-react-native', () => 'LottieView');

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));
