// app/(dashboard)/products/[id]/page.tsx

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/currency';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const getStockStatus = () => {
    if (!product.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (product.stockQuantity === 0)
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (product.reorderLevel && product.stockQuantity <= product.reorderLevel)
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const calculateProfitMargin = () => {
    if (!product.costPrice || Number(product.costPrice) === 0) return null;
    return (
      ((Number(product.price) - Number(product.costPrice)) /
        Number(product.costPrice)) *
      100
    );
  };

  const stockStatus = getStockStatus();
  const profitMargin = calculateProfitMargin();

  const handleDelete = async () => {
    'use server';

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/products/${product.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      redirect('/dashboard/products');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-1">
            SKU: {product.sku || 'Not assigned'} • Category: {product.category?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{product.name}"? This action cannot
                be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-4">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Image */}
          {product.imageUrl && (
            <Card>
              <CardContent className="pt-6">
                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Pricing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Selling Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
                </div>
                {product.costPrice && (
                  <div>
                    <p className="text-sm text-gray-600">Cost Price</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(product.costPrice)}
                    </p>
                  </div>
                )}
              </div>

              {profitMargin !== null && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-900">
                    Profit Margin: <span className="font-semibold">{profitMargin.toFixed(2)}%</span>
                  </p>
                </div>
              )}

              {product.taxRate && (
                <div>
                  <p className="text-sm text-gray-600">Tax Rate</p>
                  <p className="font-medium">{Number(product.taxRate).toFixed(2)}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-2xl font-bold">{product.stockQuantity}</p>
                </div>
                {product.reorderLevel && (
                  <div>
                    <p className="text-sm text-gray-600">Reorder Level</p>
                    <p className="text-2xl font-bold">{product.reorderLevel}</p>
                  </div>
                )}
              </div>

              {product.barcode && (
                <div>
                  <p className="text-sm text-gray-600">Barcode</p>
                  <p className="font-mono text-sm">{product.barcode}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Stock Status</p>
                <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Availability</p>
                <Badge variant={product.isActive ? 'default' : 'outline'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600">Created</p>
                <p className="font-medium">
                  {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="font-medium">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </p>
              </div>
              {product.aiTags && product.aiTags.length > 0 && (
                <div>
                  <p className="text-gray-600 mb-2">AI Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {product.aiTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
