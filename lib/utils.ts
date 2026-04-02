import { formatCurrency as globalFormatCurrency } from "@/lib/currency";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use formatCurrency from @/lib/currency instead
 * This function is kept for backward compatibility
 * It now delegates to the centralized currency configuration
 */
export function formatCurrency(amount: number, currency?: string, locale?: string): string {
  // If custom currency/locale are provided, use them for backward compatibility
  if (currency || locale) {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }
  // Otherwise, use the globally configured currency
  return globalFormatCurrency(amount);
}

export function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

