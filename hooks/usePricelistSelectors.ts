import { useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  costPrice?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface UseProductsCategoriesResult {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch available products and categories for pricelist form
 */
export function useProductsAndCategories(): UseProductsCategoriesResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch products (limit max is 100 per schema)
        const productsResponse = await fetch('/api/products?limit=100&isActive=true', {
          cache: 'no-store',
        });

        if (!productsResponse.ok) {
          const errorData = await productsResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch products (${productsResponse.status})`
          );
        }

        const productsData = await productsResponse.json();
        const productsList = productsData.data || productsData || [];
        setProducts(Array.isArray(productsList) ? productsList : []);

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories?flat=true', {
          cache: 'no-store',
        });

        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json().catch(() => ({}));
          console.warn('Failed to fetch categories:', errorData);
          setCategories([]);
        } else {
          const categoriesData = await categoriesResponse.json();
          const categoriesList = categoriesData.data || categoriesData || [];
          setCategories(Array.isArray(categoriesList) ? categoriesList : []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
        console.error('Error fetching products/categories:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { products, categories, isLoading, error };
}
