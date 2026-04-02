/**
 * Inventory utilities for CSV export and bulk operations
 */

import { ProductInventory } from '@/services/inventory.service';

/**
 * Export products to CSV format
 */
export function exportProductsToCsv(products: ProductInventory[], filename: string = 'inventory.csv') {
  const headers = [
    'Product Name',
    'SKU',
    'Category',
    'Current Stock',
    'Reorder Level',
    'Unit Cost',
    'Stock Value',
    'Price',
    'Status',
    'Last Updated'
  ];

  const rows = products.map(product => [
    product.name,
    product.sku || '',
    product.categoryName,
    product.stockQuantity.toString(),
    product.reorderLevel?.toString() || '',
    product.costPrice?.toFixed(2) || '',
    (product.costPrice ? (product.costPrice * product.stockQuantity).toFixed(2) : '0'),
    product.price.toFixed(2),
    product.stockQuantity <= (product.reorderLevel || 0) ? 'Low Stock' : 'OK',
    new Date().toISOString().split('T')[0]
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calculate total inventory value
 */
export function calculateTotalValue(products: ProductInventory[]): number {
  return products.reduce((total, product) => {
    return total + (product.costPrice ? product.costPrice * product.stockQuantity : 0);
  }, 0);
}

/**
 * Calculate statistics for a product list
 */
export function calculateInventoryStats(products: ProductInventory[]) {
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalValue = calculateTotalValue(products);
  const lowStockCount = products.filter(p => p.reorderLevel && p.stockQuantity <= p.reorderLevel).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;

  return {
    totalProducts,
    totalQuantity,
    totalValue,
    lowStockCount,
    outOfStockCount
  };
}

/**
 * Format currency with Indian Rupee symbol
 */
export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
