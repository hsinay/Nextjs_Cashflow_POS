// app/(dashboard)/products/[id]/edit/page.tsx

'use client';

import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch(`/api/categories?flat=true`),
        ]);

        if (!productRes.ok) {
          router.push('/dashboard/products');
          return;
        }

        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        setProduct(productData.data);
        setCategories(categoriesData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/dashboard/products');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      router.push(`/dashboard/products/${params.id}`);
      router.refresh();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!product) {
    return <div className="text-center py-8 text-red-600">Product not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/products/${product.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update "{product.name}"</p>
        </div>
      </div>

      <ProductForm
        product={product}
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
