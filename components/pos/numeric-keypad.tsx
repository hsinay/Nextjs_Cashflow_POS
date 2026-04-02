'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrencyLocale } from '@/lib/currency';
import { Delete } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  const [displayValue, setDisplayValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  /**
   * Convert display value (e.g., "52.50") to total cents (e.g., 5250)
   */
  const getCents = (v: string): number => {
    const num = parseFloat(v);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  /**
   * Convert cents (e.g., 5250) to formatted display (e.g., "52.50")
   */
  const formatFromCents = (cents: number): string => {
    if (isNaN(cents) || cents < 0) return '0.00';
    const amount = cents / 100;
    return amount.toLocaleString(getCurrencyLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true, // Show thousands separator
    });
  };

  /**
   * Odoo-like digit handling:
   * - Typing replaces the integer part, building up the value
   * - Maximum 2 decimal places
   */
  const handleDigit = (digit: string) => {
    if (disabled) return;

    const currentCents = getCents(displayValue);
    
    // Prevent more than 10 digits total (999,999,999.99)
    if (currentCents.toString().length >= 10 && currentCents !== 0) {
      return;
    }

    // Build new value by appending digit to cents
    const newCents = currentCents === 0 
      ? parseInt(digit, 10) 
      : currentCents * 10 + parseInt(digit, 10);

    // Cap at 2 decimal places (don't exceed cents limit)
    if (newCents > 9999999999) return; // ~100M limit

    const formatted = formatFromCents(newCents);
    setDisplayValue(formatted);
    onValueChange(formatted);
  };

  /**
   * Quick append of 00 (useful for rupee amounts)
   * e.g., "5" -> "500.00"
   */
  const handle00 = () => {
    if (disabled) return;
    const currentCents = getCents(displayValue);
    if (currentCents === 0) return;

    const newCents = currentCents * 100;
    if (newCents > 9999999999) return;

    const formatted = formatFromCents(newCents);
    setDisplayValue(formatted);
    onValueChange(formatted);
  };

  /**
   * Odoo-like backspace: Remove rightmost digit
   * "52.50" -> "5.25" -> "0.52" -> "0.05" -> "0.00"
   */
  const handleBackspace = () => {
    if (disabled) return;

    const centsValue = getCents(displayValue);
    const centsString = centsValue.toString();

    // If at 0 or single digit, reset to 0.00
    if (centsValue === 0 || centsString.length <= 1) {
      setDisplayValue('0.00');
      onValueChange('0.00');
      return;
    }

    // Remove last digit from cents
    const newCentsString = centsString.slice(0, -1);
    const newCents = parseInt(newCentsString, 10);
    const formatted = formatFromCents(newCents);

    setDisplayValue(formatted);
    onValueChange(formatted);
  };

  /**
   * Clear to 0.00 (Delete key or clear button)
   */
  const handleClear = () => {
    if (disabled) return;
    setDisplayValue('0.00');
    onValueChange('0.00');
  };

  /**
   * Handle decimal point input
   * Activates the decimal part for paise entry
   */
  const handleDecimalPoint = () => {
    if (disabled) return;
    
    // Just focus the input at the decimal position
    if (inputRef.current) {
      const decimalIndex = displayValue.indexOf('.');
      if (decimalIndex !== -1) {
        // Move cursor right after decimal point
        inputRef.current.setSelectionRange(decimalIndex + 1, decimalIndex + 1);
        inputRef.current.focus();
      }
    }
  };

  /**
   * Handle direct input (paste, manual typing)
   * Odoo-like: Accept only digits and decimal point
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    let rawValue = e.target.value;
    
    // Extract only numbers and decimal point
    const parts = rawValue.split('.');
    const integerPart = parts[0].replace(/[^0-9]/g, '');
    const decimalPart = parts[1] ? parts[1].replace(/[^0-9]/g, '').slice(0, 2) : '';

    // Reconstruct the value
    const cleanedValue = decimalPart 
      ? `${integerPart}.${decimalPart}`
      : integerPart || '0';

    // Parse and format through cents to ensure consistency
    const tempNum = parseFloat(cleanedValue);
    const cents = isNaN(tempNum) ? 0 : Math.round(tempNum * 100);
    const formatted = formatFromCents(cents);

    setDisplayValue(formatted);
    onValueChange(formatted);
    
    // Maintain cursor position
    setCursorPosition(e.target.selectionStart || 0);
  };

  /**
   * Handle focus state
   */
  const handleFocus = () => {
    setIsFocused(true);
    if (inputRef.current && displayValue === '0.00') {
      // Auto-select with proper visual feedback
      inputRef.current.setSelectionRange(0, displayValue.length);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Ensure proper formatting on blur
    const formatted = formatFromCents(getCents(displayValue));
    if (formatted !== displayValue) {
      setDisplayValue(formatted);
      onValueChange(formatted);
    }
  };

  /**
   * Keyboard support with Odoo-like behavior
   */
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key;

      // Number keys (0-9)
      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleDigit(key);
        return;
      }

      // Decimal point
      if (key === '.' || key === ',') {
        e.preventDefault();
        handleDecimalPoint();
        return;
      }

      // Backspace (Odoo behavior: remove rightmost digit)
      if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Delete (Odoo behavior: clear all)
      if (key === 'Delete') {
        e.preventDefault();
        handleClear();
        return;
      }

      // Enter (confirm)
      if (key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
        return;
      }

      // Escape (cancel)
      if (key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [disabled, onConfirm, onCancel]);

  return (
    <div className="space-y-3">
      {/* Display Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="text-right text-2xl font-bold h-14 bg-gray-50"
          disabled={disabled}
        />
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: 7, 8, 9, DEL */}
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

        {/* Row 2: 4, 5, 6, . */}
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

        {/* Row 3: 1, 2, 3, CLR */}
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
        <div /> {/* Empty cell for layout */}
        {/* Row 4: 0, 00, Blank (for layout) */}
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
          className="h-12 text-lg font-semibold hover:bg-blue-50 col-span-2"
        >
          00
        </Button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-gray-500 text-center">
        Press Enter to confirm, Esc to cancel
      </p>
    </div>
  );
}
