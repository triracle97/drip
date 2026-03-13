export interface Currency {
    code: string;
    symbol: string;
    name: string;
    symbolPosition: 'before' | 'after';
    decimalSeparator: '.' | ',';
    thousandSeparator: string;
}

export const CURRENCIES: Currency[] = [
    // Major world currencies
    { code: 'USD', symbol: '$', name: 'US Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'EUR', symbol: '\u20AC', name: 'Euro', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'GBP', symbol: '\u00A3', name: 'British Pound', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'CNY', symbol: '\u00A5', name: 'Chinese Yuan', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: "'" },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // Southeast Asia
    { code: 'VND', symbol: '\u20AB', name: 'Vietnamese Dong', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'THB', symbol: '\u0E3F', name: 'Thai Baht', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'PHP', symbol: '\u20B1', name: 'Philippine Peso', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'KHR', symbol: '\u17DB', name: 'Cambodian Riel', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'LAK', symbol: '\u20AD', name: 'Lao Kip', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'BND', symbol: 'B$', name: 'Brunei Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // South Asia
    { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'PKR', symbol: '\u20A8', name: 'Pakistani Rupee', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'BDT', symbol: '\u09F3', name: 'Bangladeshi Taka', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // East Asia
    { code: 'KRW', symbol: '\u20A9', name: 'South Korean Won', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MNT', symbol: '\u20AE', name: 'Mongolian Tugrik', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },

    // Middle East
    { code: 'AED', symbol: '\u062F.\u0625', name: 'UAE Dirham', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'SAR', symbol: '\uFDFC', name: 'Saudi Riyal', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'QAR', symbol: '\uFDFC', name: 'Qatari Riyal', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'KWD', symbol: '\u062F.\u0643', name: 'Kuwaiti Dinar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'BHD', symbol: '\u062F.\u0628', name: 'Bahraini Dinar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'OMR', symbol: '\u0631.\u0639', name: 'Omani Rial', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'JOD', symbol: '\u062F.\u0627', name: 'Jordanian Dinar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'ILS', symbol: '\u20AA', name: 'Israeli Shekel', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'TRY', symbol: '\u20BA', name: 'Turkish Lira', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'IRR', symbol: '\uFDFC', name: 'Iranian Rial', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'IQD', symbol: '\u0639.\u062F', name: 'Iraqi Dinar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'LBP', symbol: '\u0644.\u0644', name: 'Lebanese Pound', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // Europe (non-Euro)
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'PLN', symbol: 'z\u0142', name: 'Polish Zloty', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'CZK', symbol: 'K\u010D', name: 'Czech Koruna', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'BGN', symbol: '\u043B\u0432', name: 'Bulgarian Lev', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'RSD', symbol: '\u0434\u0438\u043D', name: 'Serbian Dinar', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'UAH', symbol: '\u20B4', name: 'Ukrainian Hryvnia', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'RUB', symbol: '\u20BD', name: 'Russian Ruble', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'GEL', symbol: '\u20BE', name: 'Georgian Lari', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'AMD', symbol: '\u058F', name: 'Armenian Dram', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'ALL', symbol: 'L', name: 'Albanian Lek', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'MKD', symbol: '\u0434\u0435\u043D', name: 'Macedonian Denar', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'BAM', symbol: 'KM', name: 'Bosnia Mark', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },

    // Americas
    { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'PYG', symbol: '\u20B2', name: 'Paraguayan Guarani', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolivar', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'CRC', symbol: '\u20A1', name: 'Costa Rican Colon', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'PAB', symbol: 'B/', name: 'Panamanian Balboa', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Cordoba', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'TTD', symbol: 'TT$', name: 'Trinidad Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // Africa
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'NGN', symbol: '\u20A6', name: 'Nigerian Naira', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'EGP', symbol: '\u00A3', name: 'Egyptian Pound', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MAD', symbol: '\u062F.\u0645', name: 'Moroccan Dirham', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'GHS', symbol: 'GH\u20B5', name: 'Ghanaian Cedi', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'DZD', symbol: '\u062F.\u062C', name: 'Algerian Dinar', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'TND', symbol: '\u062F.\u062A', name: 'Tunisian Dinar', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MUR', symbol: '\u20A8', name: 'Mauritian Rupee', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'BWP', symbol: 'P', name: 'Botswana Pula', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // Oceania
    { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },

    // Central Asia
    { code: 'KZT', symbol: '\u20B8', name: 'Kazakhstani Tenge', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: ' ' },
    { code: 'UZS', symbol: 'so\u02BBm', name: 'Uzbekistani Som', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },
    { code: 'AZN', symbol: '\u20BC', name: 'Azerbaijani Manat', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.' },
    { code: 'KGS', symbol: '\u0441\u043E\u043C', name: 'Kyrgyzstani Som', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',' },

    // Crypto / digital (common in subscription apps)
    { code: 'BTC', symbol: '\u20BF', name: 'Bitcoin', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',' },
];

export const DEFAULT_CURRENCY_CODE = 'USD';

export function getCurrency(code: string): Currency {
    return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}
