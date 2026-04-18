'use client';

import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/currency-context';
import { CurrencyType } from '@/lib/currency';
import { Check, Settings, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function PreferencesDialog() {
  const { activeCurrency, availableCurrencies, setCurrency, formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(activeCurrency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep selected in sync when activeCurrency loads from API
  useEffect(() => { setSelectedCurrency(activeCurrency); }, [activeCurrency]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSaveCurrency = async () => {
    setSaving(true);
    await setCurrency(selectedCurrency);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-md transition-colors duration-200 font-medium text-sm ${
          open ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
        }`}
      >
        <Settings className="h-5 w-5 flex-shrink-0" />
        <span>Preferences</span>
      </button>

      {/* Slide-out panel (above the button, to the right) */}
      {open && (
        <div className="absolute bottom-full left-full mb-0 ml-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50" style={{ bottom: 0, left: '100%' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" /> Preferences
            </span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Currency section */}
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Currency</h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {availableCurrencies.map((c) => (
                <label
                  key={c.code}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedCurrency === c.code
                      ? 'bg-blue-50 border border-blue-300'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="pref-currency"
                    value={c.code}
                    checked={selectedCurrency === c.code}
                    onChange={() => setSelectedCurrency(c.code as CurrencyType)}
                    className="accent-blue-600"
                  />
                  <span className="text-base font-bold text-slate-600 w-6">{c.symbol}</span>
                  <span className="text-sm text-slate-700">{c.displayName}</span>
                  {activeCurrency === c.code && (
                    <span className="ml-auto text-xs text-green-600 font-medium">Active</span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Preview: {formatCurrency(12345.67)}</p>
            <Button
              onClick={handleSaveCurrency}
              disabled={saving || selectedCurrency === activeCurrency}
              size="sm"
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              {saved ? <><Check className="w-3 h-3 mr-1" />Saved</> : saving ? 'Saving…' : 'Apply Currency'}
            </Button>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-slate-50 text-xs text-slate-400">
            More settings coming soon
          </div>
        </div>
      )}
    </div>
  );
}
