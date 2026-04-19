/**
 * Global Currency Configuration
 * Centralized currency settings for the entire application.
 * The active currency can be changed at runtime via setActiveCurrency().
 */

export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'NPR';

interface CurrencyConfig {
  code: CurrencyType;
  symbol: string;
  locale: string;
  decimals: number;
}

export const CURRENCY_SETTINGS: Record<CurrencyType, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', decimals: 2 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', decimals: 0 },
  NPR: { code: 'NPR', symbol: '₨', locale: 'ne-NP', decimals: 2 },
};

// Runtime-mutable active currency — updated by CurrencyProvider on client startup
let _activeCurrency: CurrencyType =
  (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY as CurrencyType) || 'NPR';

export function setActiveCurrency(currency: CurrencyType) {
  _activeCurrency = currency;
}

export function getCurrencyConfig(currency?: CurrencyType): CurrencyConfig {
  return CURRENCY_SETTINGS[currency ?? _activeCurrency];
}

// Snapshot for backward-compat imports; prefer getCurrencyConfig() for dynamic use
export const ACTIVE_CURRENCY: CurrencyType = _activeCurrency;

export function formatCurrency(
  amount: number | string,
  showSymbol: boolean = true,
  customDecimals?: number,
  currency?: CurrencyType
): string {
  if (amount === null || amount === undefined) return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';

  const config = getCurrencyConfig(currency);
  const decimals = customDecimals !== undefined ? customDecimals : config.decimals;
  const formatted = num.toLocaleString(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `${config.symbol}${formatted}` : formatted;
}

export function formatCurrencyNumber(amount: number | string, decimals?: number): string {
  return formatCurrency(amount, false, decimals);
}

export function getCurrencySymbol(currency?: CurrencyType): string {
  return getCurrencyConfig(currency).symbol;
}

export function getCurrencyCode(currency?: CurrencyType): string {
  return getCurrencyConfig(currency).code;
}

export function getCurrencyLocale(currency?: CurrencyType): string {
  return getCurrencyConfig(currency).locale;
}

export function getCurrencyDecimals(currency?: CurrencyType): number {
  return getCurrencyConfig(currency).decimals;
}

/**
 * Parses a locale-formatted amount string back to a number.
 * Handles thousands separators and decimal points based on current locale.
 */
export function parseLocaleAmount(value: string, currency?: CurrencyType): number {
  if (!value) return 0;

  const config = getCurrencyConfig(currency);

  const numberFormatter = new Intl.NumberFormat(config.locale);
  const localizedDigits = new Intl.NumberFormat(config.locale, { useGrouping: false })
    .format(9876543210)
    .split('')
    .reverse();

  const digitMap = new Map(localizedDigits.map((digit, index) => [digit, String(index)]));
  const separatorParts = numberFormatter.formatToParts(12345.6);
  const groupSeparator = separatorParts.find((part) => part.type === 'group')?.value ?? ',';
  const decimalSeparator = separatorParts.find((part) => part.type === 'decimal')?.value ?? '.';

  let clean = value.replace(config.symbol, '').trim();

  clean = clean
    .split('')
    .map((char) => digitMap.get(char) ?? char)
    .join('');

  if (groupSeparator) {
    clean = clean.split(groupSeparator).join('');
  }

  if (decimalSeparator && decimalSeparator !== '.') {
    clean = clean.replace(decimalSeparator, '.');
  }

  clean = clean.replace(/[^\d.-]/g, '');

  const result = Number.parseFloat(clean);
  return isNaN(result) ? 0 : result;
}

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

export function getCurrencyFormatter(): Intl.NumberFormat {
  const config = getCurrencyConfig();
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
}

const currencyService = {
  formatCurrency,
  formatCurrencyNumber,
  getCurrencySymbol,
  getCurrencyCode,
  getCurrencyLocale,
  getCurrencyDecimals,
  getCurrencyFormatter,
  getCurrencyConfig,
  getAvailableCurrencies,
  setActiveCurrency,
  parseLocaleAmount,
  ACTIVE_CURRENCY,
};

export default currencyService;
