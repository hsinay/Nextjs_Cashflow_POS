'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { calculateInventoryStats, exportProductsToCsv, formatCurrency } from '@/lib/inventory-utils';
import { ProductInventory } from '@/services/inventory.service';
import { Check, ChevronDown, ChevronRight, Download, Edit2, Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface StockTableProps {
  initialProducts: ProductInventory[];
}

interface EditingState {
  productId: string;
  value: string;
}

type SortField = 'name' | 'stock' | 'reorderLevel' | 'value' | 'category';
type SortOrder = 'asc' | 'desc';
type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export function StockTable({ initialProducts }: StockTableProps) {
  const [products, setProducts] = useState<ProductInventory[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(
      [...new Set(initialProducts.map((p) => p.categoryName))].slice(0, 3)
    )
  );
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Calculate stats
  const stats = calculateInventoryStats(products);

  // Group products by category
  const categories = [...new Set(products.map((p) => p.categoryName))].sort();

  // Sorting function
  const getSortValue = (product: ProductInventory, field: SortField) => {
    switch (field) {
      case 'name': return product.name.toLowerCase();
      case 'stock': return product.stockQuantity;
      case 'reorderLevel': return product.reorderLevel || 0;
      case 'value': return (product.costPrice || 0) * product.stockQuantity;
      case 'category': return product.categoryName.toLowerCase();
      default: return '';
    }
  };

  const sortProducts = (productsToSort: ProductInventory[]) => {
    return [...productsToSort].sort((a, b) => {
      const aVal = getSortValue(a, sortField);
      const bVal = getSortValue(b, sortField);
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  // Filter products based on search, category, and stock status
  const filteredProducts = sortProducts(
    products.filter((p) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter && categoryFilter !== 'all' && p.categoryName !== categoryFilter) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter === 'low_stock') {
        return p.reorderLevel && p.stockQuantity <= p.reorderLevel;
      } else if (stockStatusFilter === 'out_of_stock') {
        return p.stockQuantity === 0;
      } else if (stockStatusFilter === 'in_stock') {
        return p.stockQuantity > 0 && (!p.reorderLevel || p.stockQuantity > p.reorderLevel);
      }

      return true;
    })
  );

  const filteredCategories = categories.filter((cat) => {
    if (categoryFilter && categoryFilter !== 'all' && cat !== categoryFilter) {
      return false;
    }
    return true;
  });

  const getProductsByCategory = (categoryName: string) => {
    return filteredProducts.filter((p) => p.categoryName === categoryName);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const isLowStock = (product: ProductInventory) => {
    if (!product.reorderLevel) return false;
    return product.stockQuantity < product.reorderLevel;
  };

  const shouldShowReorderWarning = (product: ProductInventory) => {
    if (!product.reorderLevel) return false;
    return product.stockQuantity <= product.reorderLevel;
  };

  const getTotalValue = (product: ProductInventory) => {
    if (!product.costPrice) return 0;
    return product.costPrice * product.stockQuantity;
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Select/deselect all visible products
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Handle bulk update
  const handleBulkUpdate = useCallback(async () => {
    if (selectedProducts.size === 0 || !bulkQuantity) {
      toast.error('Select products and enter a quantity');
      return;
    }

    const newQuantity = parseInt(bulkQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error('Please enter a valid quantity (≥ 0)');
      return;
    }

    setBulkUpdating(true);

    try {
      const response = await fetch('/api/inventory/products/bulk/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: Array.from(selectedProducts).map(productId => ({
            productId,
            quantity: newQuantity
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update stocks');
      }

      const result = await response.json();

      // Update local state
      setProducts(prev =>
        prev.map(p => {
          const updated = result.data.updated.find((u: { id: string; stockQuantity: number }) => u.id === p.id);
          return updated ? { ...p, stockQuantity: updated.stockQuantity } : p;
        })
      );

      setSelectedProducts(new Set());
      setBulkQuantity('');
      setBulkEditMode(false);
      toast.success(`Updated ${result.data.updated.length} products`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update stocks';
      toast.error(errorMessage);
    } finally {
      setBulkUpdating(false);
    }
  }, [selectedProducts, bulkQuantity]);

  // Handle CSV export
  const handleExportCsv = () => {
    const exportData = filteredProducts.length > 0 ? filteredProducts : products;
    const timestamp = new Date().toISOString().split('T')[0];
    exportProductsToCsv(exportData, `inventory-${timestamp}.csv`);
    toast.success('Excel file downloaded');
  };

  const handleStockEdit = (productId: string, currentValue: number) => {
    setEditingState({ productId, value: currentValue.toString() });
  };

  const handleStockSave = useCallback(
    async (productId: string) => {
      if (!editingState) return;

      const newQuantity = parseInt(editingState.value, 10);

      if (isNaN(newQuantity) || newQuantity < 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      setLoading(productId);

      try {
        const response = await fetch(
          `/api/inventory/products/${productId}/stock`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update stock');
        }

        const result = await response.json();

        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, stockQuantity: result.data.stockQuantity }
              : p
          )
        );

        setEditingState(null);
        toast.success('Stock updated successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update stock';
        toast.error(errorMessage);
      } finally {
        setLoading(null);
      }
    },
    [editingState]
  );

  const handleStockCancel = () => {
    setEditingState(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    productId: string
  ) => {
    if (e.key === 'Enter') {
      handleStockSave(productId);
    } else if (e.key === 'Escape') {
      handleStockCancel();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-semibold mb-1">Total Products</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalProducts}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-semibold mb-1">Total Stock</div>
          <div className="text-2xl font-bold text-green-900">{stats.totalQuantity.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-semibold mb-1">Stock Value</div>
          <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalValue)}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm text-yellow-600 font-semibold mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.lowStockCount}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 font-semibold mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-900">{stats.outOfStockCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
        {/* First Row: Search and Export */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleExportCsv}
            variant="outline"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Second Row: Filters and Options */}
        <div className="flex gap-3 items-center flex-wrap">
          <select
            value={categoryFilter || 'all'}
            onChange={(e) => setCategoryFilter(e.target.value === 'all' ? null : e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as StockStatus)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="reorderLevel">Sort by Reorder Level</option>
            <option value="value">Sort by Value</option>
            <option value="category">Sort by Category</option>
          </select>

          <Button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </Button>

          {/* Bulk Edit Mode Toggle */}
          <div className="ml-auto flex gap-2">
            <Button
              onClick={() => {
                setBulkEditMode(!bulkEditMode);
                setSelectedProducts(new Set());
                setBulkQuantity('');
              }}
              variant={bulkEditMode ? 'default' : 'outline'}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Edit2 className="h-4 w-4" />
              {bulkEditMode ? 'Cancel Bulk' : 'Bulk Edit'}
            </Button>
          </div>
        </div>

        {/* Bulk Edit Controls */}
        {bulkEditMode && (
          <div className="flex gap-3 items-center p-3 bg-blue-50 rounded-md border border-blue-300">
            <input
              type="checkbox"
              checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
              onChange={toggleSelectAll}
              className="rounded cursor-pointer w-5 h-5"
            />
            <span className="text-sm font-medium text-slate-700">
              Selected: {selectedProducts.size} of {filteredProducts.length}
            </span>
            <div className="flex-1 flex gap-2 ml-4">
              <input
                type="number"
                min="0"
                placeholder="New quantity for all selected..."
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleBulkUpdate}
                disabled={selectedProducts.size === 0 || !bulkQuantity || bulkUpdating}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                {bulkUpdating ? 'Updating...' : 'Update All'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stock Table by Category */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="border rounded-lg p-12 text-center text-slate-500">
            <p className="text-lg font-medium">No products found.</p>
            <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          filteredCategories.map((categoryName) => {
            const categoryProducts = getProductsByCategory(categoryName);
            if (categoryProducts.length === 0) return null;

            const isExpanded = expandedCategories.has(categoryName);

            return (
              <div key={categoryName} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 flex items-center gap-3 text-left font-semibold text-slate-900 transition-colors border-b border-slate-200"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                  )}
                  <span>
                    {categoryName} <span className="text-slate-500 text-sm font-normal ml-2">({categoryProducts.length} products)</span>
                  </span>
                </button>

                {/* Category Products Table */}
                {isExpanded && (
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        {bulkEditMode && (
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={categoryProducts.every(p => selectedProducts.has(p.id))}
                              onChange={() => {
                                const newSelected = new Set(selectedProducts);
                                const allSelected = categoryProducts.every(p => selectedProducts.has(p.id));
                                categoryProducts.forEach(p => {
                                  if (allSelected) {
                                    newSelected.delete(p.id);
                                  } else {
                                    newSelected.add(p.id);
                                  }
                                });
                                setSelectedProducts(newSelected);
                              }}
                              className="rounded cursor-pointer"
                            />
                          </TableHead>
                        )}
                        <TableHead className="min-w-[150px]">Product Name</TableHead>
                        <TableHead className="w-24">SKU</TableHead>
                        <TableHead className="text-right w-20">Stock</TableHead>
                        <TableHead className="text-right w-20">Reorder</TableHead>
                        <TableHead className="text-right w-24">Unit Cost</TableHead>
                        <TableHead className="text-right w-28">Stock Value</TableHead>
                        <TableHead className="text-center w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          className={`${
                            isLowStock(product)
                              ? 'bg-yellow-50 hover:bg-yellow-100'
                              : 'hover:bg-slate-50'
                          } transition-colors border-b border-slate-100`}
                        >
                          {bulkEditMode && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={() => toggleProductSelection(product.id)}
                                className="rounded cursor-pointer w-5 h-5"
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-slate-900">
                            <div className="truncate">{product.name}</div>
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {product.sku || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingState?.productId === product.id ? (
                              <div className="flex gap-2 justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  max="99999"
                                  value={editingState.value}
                                  onChange={(e) =>
                                    setEditingState({
                                      ...editingState,
                                      value: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, product.id)
                                  }
                                  className="w-20 px-2 py-1 border border-blue-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleStockSave(product.id)
                                  }
                                  disabled={loading === product.id}
                                  className="text-xs bg-green-600 hover:bg-green-700"
                                >
                                  {loading === product.id ? '...' : <Check className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleStockCancel}
                                  disabled={loading === product.id}
                                  className="text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleStockEdit(
                                    product.id,
                                    product.stockQuantity
                                  )
                                }
                                className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer hover:underline"
                              >
                                {product.stockQuantity}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {product.reorderLevel ? (
                              <span
                                className={
                                  product.stockQuantity <=
                                  product.reorderLevel
                                    ? 'text-red-600 font-bold'
                                    : ''
                                }
                              >
                                {product.reorderLevel}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {product.costPrice
                              ? formatCurrency(product.costPrice)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {product.costPrice
                              ? formatCurrency(getTotalValue(product))
                              : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {shouldShowReorderWarning(product) ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                                ⚠️ Low
                              </span>
                            ) : product.stockQuantity === 0 ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">
                                ⊘ Empty
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                ✓ OK
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
