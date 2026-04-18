'use client';

import {
  CURRENCY_SETTINGS,
  CurrencyType,
  formatCurrency as staticFormatCurrency,
  getAvailableCurrencies,
  setActiveCurrency,
} from '@/lib/currency';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface CurrencyContextValue {
  activeCurrency: CurrencyType;
  currencySymbol: string;
  isLoading: boolean;
  formatCurrency: (amount: number | string, showSymbol?: boolean) => string;
  setCurrency: (currency: CurrencyType) => Promise<void>;
  availableCurrencies: ReturnType<typeof getAvailableCurrencies>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [activeCurrency, _setActiveCurrency] = useState<CurrencyType>('NPR');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/currency')
      .then((r) => r.json())
      .then((data) => {
        if (data.currency) {
          _setActiveCurrency(data.currency as CurrencyType);
          setActiveCurrency(data.currency as CurrencyType); // sync module-level var
        }
      })
      .catch(() => {/* use default */})
      .finally(() => setIsLoading(false));
  }, []);

  const setCurrency = useCallback(async (currency: CurrencyType) => {
    await fetch('/api/settings/currency', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency }),
    });
    _setActiveCurrency(currency);
    setActiveCurrency(currency); // sync module-level var
  }, []);

  const formatCurrencyCtx = useCallback(
    (amount: number | string, showSymbol = true) => {
      // Use staticFormatCurrency — it reads from the module-level _activeCurrency
      // which we keep in sync via setActiveCurrency above
      return staticFormatCurrency(amount, showSymbol);
    },
    [activeCurrency] // re-create when currency changes so consumers re-render
  );

  return (
    <CurrencyContext.Provider
      value={{
        activeCurrency,
        currencySymbol: CURRENCY_SETTINGS[activeCurrency]?.symbol ?? '₨',
        isLoading,
        formatCurrency: formatCurrencyCtx,
        setCurrency,
        availableCurrencies: getAvailableCurrencies(),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
