import { getCurrencySymbol } from '@/lib/currency';

interface CurrencySymbolProps {
  className?: string;
}

export function CurrencySymbol({ className }: CurrencySymbolProps) {
  return <span className={className}>{getCurrencySymbol()}</span>;
}
