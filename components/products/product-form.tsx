'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createProductSchema, updateProductSchema } from '@/lib/validations/product.schema';
import { Category } from '@/types/category.types';
import { CreateProductInput, Product, UpdateProductInput } from '@/types/product.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit?: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({
  product,
  categories,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const router = useRouter();
  const [profitMargin, setProfitMargin] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use appropriate schema based on whether we're creating or updating
  const schema = product ? updateProductSchema : createProductSchema;
  const form = useForm<CreateProductInput | UpdateProductInput>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          imageUrl: product.imageUrl || '',
          price: Number(product.price),
          costPrice: product.costPrice ? Number(product.costPrice) : undefined,
          stockQuantity: product.stockQuantity,
          reorderLevel: product.reorderLevel || undefined,
          taxRate: product.taxRate ? Number(product.taxRate) : undefined,
          categoryId: product.categoryId,
        }
      : {
          stockQuantity: 0,
          price: 0,
          categoryId: '',
          name: '',
          description: '',
          sku: '',
          barcode: '',
          imageUrl: '',
        },
  });

  // Watch for price and costPrice changes to calculate profit margin
  const price = form.watch('price');
  const costPrice = form.watch('costPrice');

  useEffect(() => {
    if (price && costPrice && costPrice > 0) {
      const margin = ((Number(price) - Number(costPrice)) / Number(costPrice)) * 100;
      setProfitMargin(margin);
    } else {
      setProfitMargin(null);
    }
  }, [price, costPrice]);

  const uploadProductImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/cashflow-pos/products');

    const response = await fetch('/api/uploads/image', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload image');
    }

    return result.data.url as string;
  };

  // Handle form submission
  const handleFormSubmit = async (data: CreateProductInput | UpdateProductInput) => {
    try {
      setError(null);
      setSuccess(null);

      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Call API directly if onSubmit is not provided
        const method = product ? 'PUT' : 'POST';
        const url = product ? `/api/products/${product.id}` : '/api/products';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save product');
        }
      }

      setSuccess(product ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => {
        router.push('/dashboard/products');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{product ? 'Edit Product' : 'Create New Product'}</CardTitle>
          <CardDescription>
            {product
              ? 'Update product information'
              : 'Add a new product to your inventory'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-6"
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Basic Information</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          className="resize-none"
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            {field.value && categories.length > 0
                              ? categories.find((c) => c.id === field.value)?.name
                              : 'Select a category'}
                          </SelectTrigger>
                          <SelectContent>
                            {categories && categories.length > 0 ? (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No categories available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {categories.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Please create categories first
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Identification */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Product Identification</h3>

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Stock Keeping Unit (auto-generated if empty)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for auto-generation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter barcode" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Pricing</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {profitMargin !== null && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-900">
                      Profit Margin: <span className="font-semibold">{profitMargin.toFixed(2)}%</span>
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Inventory */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Inventory</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reorderLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when stock falls below this level
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Media</h3>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={(url) => {
                            field.onChange(url);
                          }}
                          onImageUpload={uploadProductImage}
                          placeholder="https://example.com/image.jpg"
                          description="JPG, PNG, or WebP (max. 5MB)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
