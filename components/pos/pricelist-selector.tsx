'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Pricelist {
  id: string;
  name: string;
  isActive: boolean;
}

interface PricelistSelectorProps {
  pricelists: Pricelist[];
  selectedPricelistId: string | null;
  onSelectPricelist: (pricelistId: string | null) => void;
  disabled?: boolean;
}

export function PricelistSelector({
  pricelists,
  selectedPricelistId,
  onSelectPricelist,
  disabled = false,
}: PricelistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activePricelists = pricelists.filter(p => p.isActive);
  const selectedPricelist = selectedPricelistId
    ? activePricelists.find(p => p.id === selectedPricelistId)
    : null;

  const handleSelect = (pricelistId: string | null) => {
    onSelectPricelist(pricelistId);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide shrink-0">
        Price List:
      </label>

      <div className="relative flex-1">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || activePricelists.length === 0}
          className="w-full flex items-center justify-between px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-left truncate">
            {selectedPricelist ? selectedPricelist.name : 'Default'}
          </span>
          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-max">
            {/* Default Price Option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                selectedPricelistId === null
                  ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              Default
            </button>

            {/* Pricelist Options */}
            {activePricelists.length > 0 && (
              <>
                <div className="border-t border-gray-200" />
                {activePricelists.map(pricelist => (
                  <button
                    key={pricelist.id}
                    onClick={() => handleSelect(pricelist.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      selectedPricelistId === pricelist.id
                        ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pricelist.name}
                  </button>
                ))}
              </>
            )}

            {/* Empty State */}
            {activePricelists.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                No pricelists
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Info */}
      {selectedPricelist && (
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <span>✓</span> {selectedPricelist.name} selected
        </p>
      )}
    </div>
  );
}
