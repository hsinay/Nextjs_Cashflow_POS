import { formatCurrency as globalFormatCurrency } from "@/lib/currency";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use formatCurrency from @/lib/currency instead
 * This function is kept for backward compatibility
 * It delegates to the centralized currency configuration.
 */
export function formatCurrency(amount: number, _currency?: string, _locale?: string): string {
  return globalFormatCurrency(amount);
}

export function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

/**
 * Format date with full timestamp (e.g., "4/6/2026, 6:46:30 PM")
 * Uses manual formatting to prevent hydration mismatches across server/client
 * Avoids toLocaleString which can produce different results depending on platform
 */
export function formatDateTimeLocale(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use local getters for consistent client-side rendering
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${month}/${day}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
}
