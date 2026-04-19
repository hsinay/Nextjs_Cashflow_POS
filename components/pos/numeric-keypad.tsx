'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrencyLocale } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';
import { Delete } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface NumericKeypadProps {
  value: string;
  onValueChange: (value: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function NumericKeypad({
  value,
  onValueChange,
  onConfirm,
  onCancel,
  disabled = false,
  placeholder = '0.00',
}: NumericKeypadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [rawValue, setRawValue] = useState('0');
  const { activeCurrency } = useCurrency();
  const currencyLocale = getCurrencyLocale(activeCurrency);

  const { decimalSeparator, localizedDigitMap, asciiToLocalizedDigit } = useMemo(() => {
    const formatter = new Intl.NumberFormat(currencyLocale, { useGrouping: false });
    const localizedDigits = formatter.format(9876543210).split('').reverse();
    const localizedDigitEntries = localizedDigits.map((digit, index) => [digit, String(index)] as const);
    const decimalPart = formatter.formatToParts(1.1).find((part) => part.type === 'decimal');

    return {
      decimalSeparator: decimalPart?.value ?? '.',
      localizedDigitMap: new Map(localizedDigitEntries),
      asciiToLocalizedDigit: new Map(localizedDigitEntries.map(([localizedDigit, asciiDigit]) => [asciiDigit, localizedDigit])),
    };
  }, [currencyLocale]);

  const localizeDigits = (input: string): string =>
    input
      .split('')
      .map((char) => {
        if (char === '.') return decimalSeparator;
        return asciiToLocalizedDigit.get(char) ?? char;
      })
      .join('');

  const normalizeInput = (input: string): string =>
    input
      .split('')
      .map((char) => {
        if (char === decimalSeparator) return '.';
        return localizedDigitMap.get(char) ?? char;
      })
      .join('');

  const normalizeRawValue = (input: string): string => {
    const cleaned = normalizeInput(input).replace(/[^0-9.]/g, '');
    const [integerPartRaw = '', ...decimalParts] = cleaned.split('.');
    const hasDecimal = cleaned.includes('.');
    const decimalPart = decimalParts.join('').slice(0, 2);

    const normalizedInteger = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';

    if (hasDecimal) {
      return `${normalizedInteger}.${decimalPart}`;
    }

    return normalizedInteger;
  };

  const toEditableValue = (input: string): string => {
    const normalized = normalizeRawValue(input);

    if (!normalized.includes('.')) {
      return normalized;
    }

    const [integerPart, decimalPart = ''] = normalized.split('.');
    const trimmedDecimalPart = decimalPart.replace(/0+$/, '');

    if (trimmedDecimalPart.length === 0) {
      return integerPart;
    }

    return `${integerPart}.${trimmedDecimalPart}`;
  };

  const formatValueForCurrency = (input: string): string => {
    const numericValue = Number.parseFloat(input);

    if (Number.isNaN(numericValue) || numericValue < 0) {
      return '0.00';
    }

    return numericValue.toLocaleString(getCurrencyLocale(activeCurrency), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  };

  useEffect(() => {
    if (!isFocused) {
      setRawValue(toEditableValue(value));
    }
  }, [isFocused, value]);

  const commitValue = (nextRawValue: string) => {
    const normalized = normalizeRawValue(nextRawValue);
    setRawValue(normalized);
    onValueChange(normalized);
  };

  const handleDigit = (digit: string) => {
    if (disabled) return;

    if (rawValue.includes('.')) {
      const [integerPart, decimalPart = ''] = rawValue.split('.');
      if (decimalPart.length >= 2) return;
      commitValue(`${integerPart}.${decimalPart}${digit}`);
      return;
    }

    commitValue(rawValue === '0' ? digit : `${rawValue}${digit}`);
  };

  const handle00 = () => {
    if (disabled || rawValue === '0') return;

    if (rawValue.includes('.')) {
      const [integerPart, decimalPart = ''] = rawValue.split('.');
      if (decimalPart.length >= 2) return;
      commitValue(`${integerPart}.${decimalPart}0`);
      return;
    }

    commitValue(`${rawValue}00`);
  };

  const handleBackspace = () => {
    if (disabled) return;

    if (rawValue.length <= 1) {
      commitValue('0');
      return;
    }

    const nextRawValue = rawValue.slice(0, -1);
    if (nextRawValue === '' || nextRawValue === '.') {
      commitValue('0');
      return;
    }

    commitValue(nextRawValue);
  };

  const handleClear = () => {
    if (disabled) return;
    commitValue('0');
  };

  const handleDecimalPoint = () => {
    if (disabled || rawValue.includes('.')) return;
    commitValue(`${rawValue}.`);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    commitValue(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(rawValue.length, rawValue.length);
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalized = normalizeRawValue(rawValue);
    setRawValue(normalized);
    onValueChange(formatValueForCurrency(normalized));
  };

  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [disabled, isFocused, onCancel, onConfirm]);

  const inputValue = useMemo(() => {
    if (isFocused) {
      return localizeDigits(rawValue);
    }

    return formatValueForCurrency(rawValue);
  }, [isFocused, localizeDigits, rawValue]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="text-right text-2xl font-bold h-14 bg-gray-50"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={() => handleDigit('7')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          7
        </Button>
        <Button
          onClick={() => handleDigit('8')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          8
        </Button>
        <Button
          onClick={() => handleDigit('9')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          9
        </Button>
        <Button
          onClick={handleBackspace}
          disabled={disabled}
          variant="destructive"
          className="h-12 hover:bg-red-600"
        >
          <Delete className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => handleDigit('4')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          4
        </Button>
        <Button
          onClick={() => handleDigit('5')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          5
        </Button>
        <Button
          onClick={() => handleDigit('6')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          6
        </Button>
        <Button
          onClick={handleClear}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-orange-50 text-orange-600 border-orange-200"
        >
          CLR
        </Button>

        <Button
          onClick={() => handleDigit('1')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          1
        </Button>
        <Button
          onClick={() => handleDigit('2')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          2
        </Button>
        <Button
          onClick={() => handleDigit('3')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          3
        </Button>
        <Button
          onClick={handleDecimalPoint}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          .
        </Button>

        <Button
          onClick={() => handleDigit('0')}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50 col-span-2"
        >
          0
        </Button>
        <Button
          onClick={handle00}
          disabled={disabled}
          variant="outline"
          className="h-12 text-lg font-semibold hover:bg-blue-50"
        >
          00
        </Button>
        <div />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Press Enter to confirm, Esc to cancel
      </p>
    </div>
  );
}
