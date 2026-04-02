'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addCountLineSchema } from '@/lib/validations/physical-inventory.schema';
import { Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface CountLineFormProps {
  piId: string;
}

export function CountLineForm({ piId }: CountLineFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [variance, setVariance] = useState<number | null>(null);
  const [systemQty, setSystemQty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(addCountLineSchema),
    defaultValues: {
      physicalInventoryId: piId,
      productId: '',
      physicalQuantity: 0,
      batchNumber: '',
      expiryDate: '',
      notes: '',
      countedBy: '',
    },
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=500&page=1');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data.data || []);
        setFilteredProducts(data.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Watch product and physical quantity to calculate variance
  const selectedProductId = form.watch('productId');
  const physicalQty = form.watch('physicalQuantity');

  // Update system quantity when product is selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        const systemQuantity = product.stockQuantity || 0;
        setSystemQty(systemQuantity);
        setSearchQuery(''); // Clear search after selection
      }
    } else {
      setSystemQty(null);
    }
  }, [selectedProductId, products]);

  // Calculate variance when physical quantity changes
  useEffect(() => {
    if (selectedProductId && systemQty !== null) {
      if (physicalQty > 0) {
        setVariance(physicalQty - systemQty);
      } else {
        setVariance(null);
      }
    } else {
      setVariance(null);
    }
  }, [physicalQty, selectedProductId, systemQty]);

  const onSubmit = async (data: any) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/physical-inventory/${piId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add count line');
      }

      form.reset();
      setVariance(null);
      setSystemQty(null);
      setSearchQuery('');
      // Line added successfully
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="text-lg font-semibold">Add Count Line</h3>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Product Selection with Search */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <div className="relative">
                    <div className="space-y-2">
                      {/* Display selected product */}
                      {selectedProduct && (
                        <div className="border rounded-md p-2 bg-slate-50 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{selectedProduct.name}</p>
                            <p className="text-xs text-slate-500">{selectedProduct.sku}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('');
                              setSearchQuery('');
                            }}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <X className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>
                      )}

                      {/* Search input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search product name or SKU..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsProductDropdownOpen(true);
                          }}
                          onFocus={() => setIsProductDropdownOpen(true)}
                          disabled={loadingProducts || !!selectedProduct}
                          className="pl-9"
                        />
                      </div>

                      {/* Dropdown list */}
                      {isProductDropdownOpen && !selectedProduct && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-md z-50 max-h-48 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(product.id);
                                  setIsProductDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-100 border-b last:border-b-0 transition"
                              >
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-slate-500">
                                  SKU: {product.sku} • Stock: {product.stockQuantity}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-500">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Physical Quantity */}
            <FormField
              control={form.control}
              name="physicalQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* System Quantity & Variance Display */}
          {systemQty !== null && (
            <div className={`p-4 rounded-md border-2 ${variance === null ? 'bg-blue-50 border-blue-200' : variance === 0 ? 'bg-green-50 border-green-200' : variance > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">System Quantity</p>
                  <p className="text-2xl font-bold text-slate-900">{systemQty}</p>
                </div>
                {variance !== null && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Variance</p>
                    <p className={`text-2xl font-bold ${variance === 0 ? 'text-green-600' : variance > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {variance > 0 ? '+' : ''}{variance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Batch Number */}
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BATCH-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about this count..."
                    className="h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Count Line
          </Button>
        </form>
      </Form>
    </div>
  );
}
