// components/categories/category-form.tsx

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { createCategorySchema, updateCategorySchema } from '@/lib/validations/category.schema';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface CategoryFormProps {
  defaultValues?: Partial<Category>;
  isEditing?: boolean;
  onSubmit?: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  redirectTo?: string;
}

/**
 * Reusable form component for creating and editing categories
 * Handles validation, error display, and form submission
 */
export function CategoryForm({
  defaultValues,
  isEditing = false,
  onSubmit,
  redirectTo = '/dashboard/categories',
}: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Use appropriate schema based on whether editing or creating
  const schema = isEditing ? updateCategorySchema : createCategorySchema;

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      parentCategoryId: defaultValues?.parentCategoryId || null,
      imageUrl: defaultValues?.imageUrl || '',
    },
  });

  // Fetch available parent categories
  useEffect(() => {
    const fetchParentCategories = async (): Promise<void> => {
      setLoadingParents(true);
      try {
        const response = await fetch(`/api/categories?flat=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        // Filter out current category if editing
        const filtered = data.data.filter(
          (cat: Category) => !isEditing || cat.id !== defaultValues?.id
        );
        setParentCategories(filtered);
      } catch (err) {
        console.error('Error fetching parent categories:', err);
      } finally {
        setLoadingParents(false);
      }
    };

    fetchParentCategories();
  }, [isEditing, defaultValues?.id]);

  const uploadCategoryImage = async (file: File): Promise<string> => {
    const payload = new FormData();
    payload.append('file', file);
    payload.append('folder', '/cashflow-pos/categories');

    const response = await fetch('/api/uploads/image', {
      method: 'POST',
      body: payload,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload image');
    }

    return result.data.url as string;
  };

  async function handleSubmit(formData: any): Promise<void> {
    setError(null);
    setIsLoading(true);

    try {
      // Prepare data
      const submitData: CreateCategoryInput | UpdateCategoryInput = {
        ...formData,
        parentCategoryId: formData.parentCategoryId || null,
        imageUrl: formData.imageUrl || null,
      };

      // Use custom onSubmit if provided
      if (onSubmit) {
        await onSubmit(submitData);
      } else {
        // Make API call
        const url = isEditing
          ? `/api/categories/${defaultValues?.id}`
          : '/api/categories';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} category`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} category`);
        }
      }

      // Redirect on success
      router.push(redirectTo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Form submission error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form form={form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter category name"
                    {...field}
                    disabled={isLoading}
                    maxLength={100}
                  />
                </FormControl>
                <FormDescription>
                  The display name for this category (1-100 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter category description"
                    className="min-h-24"
                    {...field}
                    disabled={isLoading}
                    maxLength={500}
                  />
                </FormControl>
                <FormDescription>
                  Optional description (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Parent Category Field */}
          <FormField
            control={form.control}
            name="parentCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category</FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value === '' ? null : value)}
                  disabled={isLoading || loadingParents}
                >
                  <SelectTrigger placeholder="None (Root Category)" />
                  <SelectContent>
                    <SelectItem value="">None (Root Category)</SelectItem>
                    {parentCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Optional - leave empty for root-level category
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Field */}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    value={field.value || ''}
                    onChange={(url) => field.onChange(url)}
                    onImageUpload={uploadCategoryImage}
                    placeholder="https://example.com/image.jpg"
                    description="JPG, PNG, or WebP (max. 5MB)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">⏳</span>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Category' : 'Create Category'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
