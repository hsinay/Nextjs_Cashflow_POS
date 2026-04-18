'use client';

import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/currency-context';
import { CurrencyType } from '@/lib/currency';
import { Check } from 'lucide-react';
import { useState } from 'react';

export default function CurrencySettingsPage() {
  const { activeCurrency, availableCurrencies, setCurrency, formatCurrency } = useCurrency();
  const [selected, setSelected] = useState<CurrencyType>(activeCurrency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await setCurrency(selected);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Currency Settings</h1>
      <p className="text-slate-500 text-sm mb-6">
        Select the currency used throughout the system. All prices and totals will display in the selected currency.
      </p>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="space-y-2">
          {availableCurrencies.map((c) => (
            <label
              key={c.code}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selected === c.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="currency"
                  value={c.code}
                  checked={selected === c.code}
                  onChange={() => setSelected(c.code as CurrencyType)}
                  className="accent-blue-600"
                />
                <span className="text-2xl font-bold text-slate-700 w-8">{c.symbol}</span>
                <div>
                  <p className="font-medium text-slate-900">{c.displayName}</p>
                  <p className="text-xs text-slate-500">e.g. {c.symbol}1,000.00</p>
                </div>
              </div>
              {activeCurrency === c.code && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Active</span>
              )}
            </label>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Preview: {formatCurrency(1234567.89)}
          </p>
          <Button
            onClick={handleSave}
            disabled={saving || selected === activeCurrency}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saved ? (
              <><Check className="w-4 h-4 mr-1" /> Saved</>
            ) : saving ? 'Saving...' : 'Save Currency'}
          </Button>
        </div>
      </div>
    </div>
  );
}
