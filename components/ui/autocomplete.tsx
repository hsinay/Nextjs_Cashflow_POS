'use client';

import { BorderRadius, Colors, Spacing } from '@/lib/design-tokens';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

export interface AutocompleteOption {
  id: string;
  label: string;
  value: string;
  searchText?: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  displayValue?: (option: AutocompleteOption | undefined) => string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
  closeOnSelect?: boolean;
}

export const Autocomplete = React.forwardRef<HTMLDivElement, AutocompleteProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      searchPlaceholder = 'Search...',
      displayValue,
      disabled = false,
      isLoading = false,
      error,
      closeOnSelect = true,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Find selected option
    const selectedOption = options.find((opt) => opt.value === value);

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
      if (!searchValue.trim()) return options;
      const searchLower = searchValue.toLowerCase();
      return options.filter((option) => {
        const label = option.label.toLowerCase();
        const searchText = (option.searchText || option.label).toLowerCase();
        return label.includes(searchLower) || searchText.includes(searchLower);
      });
    }, [options, searchValue]);

    // Handle option selection
    const handleSelect = (option: AutocompleteOption) => {
      onChange(option.value);
      if (closeOnSelect) {
        setOpen(false);
        setSearchValue('');
        setHighlightedIndex(-1);
      }
      inputRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setHighlightedIndex(-1);
          break;
        default:
          break;
      }
    };

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted option into view
    React.useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const highlightedElement = listRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex]);

    return (
      <div ref={ref || containerRef} className="relative w-full">
        <div
          style={{
            position: 'relative',
            border: `1px solid ${error ? Colors.danger : Colors.gray[300]}`,
            borderRadius: BorderRadius.md,
            backgroundColor: disabled ? Colors.gray[50] : '#ffffff',
            overflow: 'hidden',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={open ? searchValue : displayValue?.(selectedOption) || selectedOption?.label || ''}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={displayValue?.(selectedOption) || placeholder}
            disabled={disabled || isLoading}
            style={{
              width: '100%',
              padding: `${Spacing.sm} ${Spacing.md}`,
              fontSize: '14px',
              color: Colors.text.primary,
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(!open);
              setHighlightedIndex(-1);
              setSearchValue('');
            }}
            disabled={disabled || isLoading}
            style={{
              position: 'absolute',
              right: '0',
              top: '0',
              bottom: '0',
              padding: `0 ${Spacing.sm}`,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <ChevronDown
              className="w-4 h-4"
              style={{
                color: Colors.text.secondary,
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>

        {/* Dropdown List */}
        {open && (
          <div
            ref={listRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: `1px solid ${Colors.gray[200]}`,
              borderRadius: BorderRadius.md,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  padding: `${Spacing.lg}`,
                  textAlign: 'center',
                  color: Colors.text.secondary,
                  fontSize: '14px',
                }}
              >
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: `${Spacing.lg}`,
                  textAlign: 'center',
                  color: Colors.text.secondary,
                  fontSize: '14px',
                }}
              >
                No results found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    width: '100%',
                    padding: `${Spacing.sm} ${Spacing.md}`,
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor:
                      highlightedIndex === index ? Colors.primary.light : '#ffffff',
                    color: Colors.text.primary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: Spacing.sm,
                    transition: 'background-color 0.15s',
                  }}
                >
                  <span style={{ flex: 1 }}>
                    <div style={{ fontWeight: value === option.value ? 600 : 400 }}>
                      {option.label}
                    </div>
                    {option.searchText && option.searchText !== option.label && (
                      <div style={{ fontSize: '12px', color: Colors.text.secondary }}>
                        {option.searchText}
                      </div>
                    )}
                  </span>
                  {value === option.value && (
                    <Check
                      className="w-4 h-4"
                      style={{ color: Colors.primary.start, flexShrink: 0 }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginTop: Spacing.xs,
              fontSize: '12px',
              color: Colors.danger,
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

Autocomplete.displayName = 'Autocomplete';
