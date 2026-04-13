/**
 * Global Currency Configuration
 * Centralized currency settings for the entire application
 * Change the CURRENCY setting here and it will reflect across all modules
 */

export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'NPR';

interface CurrencyConfig {
  code: CurrencyType;
  symbol: string;
  locale: string;
  decimals: number;
}

// Default currency configuration
const CURRENCY_SETTINGS: Record<CurrencyType, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    decimals: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    locale: 'de-DE',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    locale: 'ja-JP',
    decimals: 0,
  },
  NPR: {
    code: 'NPR',
    symbol: '₨',
    locale: 'ne-NP',
    decimals: 2,
  },
};

/**
 * ⚠️ CHANGE THIS TO SWITCH CURRENCY GLOBALLY
 * Options: 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'NPR'
 * All currency displays will automatically update
 */
export const ACTIVE_CURRENCY: CurrencyType = 'INR';

/**
 * Get current currency configuration
 */
export function getCurrencyConfig(): CurrencyConfig {
  return CURRENCY_SETTINGS[ACTIVE_CURRENCY];
}

/**
 * Format number as currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @param customDecimals - Override default decimal places
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(10000) → '₹10,000.00'
 * formatCurrency(10000, false) → '10,000.00'
 * formatCurrency(10000, true, 0) → '₹10,000'
 */
export function formatCurrency(
  amount: number | string,
  showSymbol: boolean = true,
  customDecimals?: number
): string {
  if (amount === null || amount === undefined) return '0.00';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';

  const config = getCurrencyConfig();
  const decimals = customDecimals !== undefined ? customDecimals : config.decimals;

  const formatted = num.toLocaleString(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${config.symbol}${formatted}` : formatted;
}

/**
 * Format currency without symbol (just number formatting)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 *
 * @example
 * formatCurrencyNumber(10000) → '10,000.00'
 * formatCurrencyNumber(10000, 0) → '10,000'
 */
export function formatCurrencyNumber(amount: number | string, decimals?: number): string {
  return formatCurrency(amount, false, decimals);
}

/**
 * Get only the currency symbol
 * @returns Currency symbol
 *
 * @example
 * getCurrencySymbol() → '₹'
 */
export function getCurrencySymbol(): string {
  return getCurrencyConfig().symbol;
}

/**
 * Get currency code (e.g., 'INR', 'USD')
 * @returns Currency code
 */
export function getCurrencyCode(): string {
  return getCurrencyConfig().code;
}

/**
 * Get locale string for toLocaleString() method
 * @returns Locale string
 */
export function getCurrencyLocale(): string {
  return getCurrencyConfig().locale;
}

/**
 * Get number of decimal places for this currency
 * @returns Number of decimals
 */
export function getCurrencyDecimals(): number {
  return getCurrencyConfig().decimals;
}

/**
 * Get list of all available currencies for dropdowns/selectors
 * @returns Array of currency objects with code, symbol, and display name
 *
 * @example
 * const currencies = getAvailableCurrencies();
 * // [
 * //   { code: 'INR', symbol: '₹', displayName: 'INR - Indian Rupee' },
 * //   { code: 'NPR', symbol: '₨', displayName: 'NPR - Nepalese Rupee' },
 * //   ...
 * // ]
 */
export function getAvailableCurrencies() {
  const currencyNames: Record<CurrencyType, string> = {
    INR: 'Indian Rupee',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    NPR: 'Nepalese Rupee',
  };

  return (Object.keys(CURRENCY_SETTINGS) as CurrencyType[]).map((code) => ({
    code,
    symbol: CURRENCY_SETTINGS[code].symbol,
    displayName: `${code} - ${currencyNames[code]}`,
  }));
}

/**
 * Format in Intl.NumberFormat style (for advanced formatting)
 * @param amount - The amount to format
 * @returns Intl.NumberFormat instance
 *
 * @example
 * const formatter = getCurrencyFormatter();
 * formatter.format(10000) → '₹10,000.00'
 */
export function getCurrencyFormatter(): Intl.NumberFormat {
  const config = getCurrencyConfig();
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
}

export default {
  formatCurrency,
  formatCurrencyNumber,
  getCurrencySymbol,
  getCurrencyCode,
  getCurrencyLocale,
  getCurrencyDecimals,
  getCurrencyFormatter,
  getCurrencyConfig,
  getAvailableCurrencies,
  ACTIVE_CURRENCY,
};
