// components/products/low-stock-alert.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getLowStockProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        AND: [
          {
            reorderLevel: {
              not: null,
            },
          },
          {
            stockQuantity: {
              lte: prisma.product.fields.reorderLevel,
            },
          },
        ],
      },
      include: {
        category: true,
      },
      orderBy: {
        stockQuantity: 'asc',
      },
      take: 10,
    });

    return products;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return [];
  }
}

export async function LowStockAlert() {
  const products = await getLowStockProducts();

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            Low Stock Alert
          </CardTitle>
          <CardDescription>All products have adequate stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No products currently below reorder level</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alert
        </CardTitle>
        <CardDescription className="text-yellow-800">
          {products.length} product{products.length !== 1 ? 's' : ''} below reorder level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
            >
              <div className="flex-1">
                <Link href={`/dashboard/products/${product.id}`}>
                  <p className="font-medium text-sm hover:text-blue-600 hover:underline">
                    {product.name}
                  </p>
                </Link>
                <p className="text-xs text-gray-600">
                  {product.category?.name} • Stock: {product.stockQuantity} / Min:{' '}
                  {product.reorderLevel}
                </p>
              </div>
              <Badge variant="destructive" className="ml-2">
                Low
              </Badge>
            </div>
          ))}
        </div>

        <Link href="/dashboard/products?lowStock=true">
          <Button variant="outline" size="sm" className="w-full">
            View All Low Stock Products
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
