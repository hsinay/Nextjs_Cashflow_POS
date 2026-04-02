'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { Product } from '@/types/product.types';
import { Edit, Eye, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
}

export function ProductCard({ product, showActions = true }: ProductCardProps) {
  const getStockStatus = () => {
    if (!product.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (product.stockQuantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (product.reorderLevel && product.stockQuantity <= product.reorderLevel)
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus();
  const profitMargin = product.costPrice
    ? (
        ((Number(product.price) - Number(product.costPrice)) /
          Number(product.costPrice)) *
        100
      ).toFixed(2)
    : null;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden rounded-t-lg">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-8 w-8" /> {/* Use Package icon as placeholder */}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        <CardDescription className="text-xs">
          {product.category?.name || 'Uncategorized'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        )}

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatCurrency(Number(product.price))}
            </span>
            {product.costPrice && (
              <span className="text-xs text-gray-500 line-through">
                {formatCurrency(Number(product.costPrice))}
              </span>
            )}
          </div>

          {profitMargin && (
            <p className="text-xs text-green-600 font-medium">
              Margin: {profitMargin}%
            </p>
          )}
        </div>

        {/* Stock Info */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Stock:</span>
            <span className="font-semibold">{product.stockQuantity}</span>
          </div>
          {product.reorderLevel && (
            <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
              <span>Min:</span>
              <span>{product.reorderLevel}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {product.aiTags && product.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {product.aiTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.aiTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{product.aiTags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="grid grid-cols-2 gap-2 pt-3">
          <Link href={`/dashboard/products/${product.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/dashboard/products/${product.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
