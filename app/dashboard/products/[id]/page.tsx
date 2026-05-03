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
import { formatCurrency } from '@/lib/currency';
import { getOptimizedImageUrl } from '@/lib/image-url';
import { prisma } from '@/lib/prisma';
import {
    ArrowLeft,
    BarChart3,
    Box,
    Calendar,
    Edit,
    Hash,
    Package,
    ShoppingCart,
    Tag,
    TrendingUp,
    Trash2,
    Layers,
} from 'lucide-react';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getProductData(id: string) {
  const [product, salesStats, recentTransactions, recentSalesOrders, inventoryHistory, variants] =
    await Promise.all([
      prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          sku: true,
          barcode: true,
          imageUrl: true,
          price: true,
          costPrice: true,
          stockQuantity: true,
          reorderLevel: true,
          taxRate: true,
          isActive: true,
          categoryId: true,
          aiTags: true,
          predictedDemandImpact: true,
          forecastedReorderDate: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
      }),

      prisma.transactionItem.aggregate({
        where: { productId: id },
        _sum: { quantity: true, totalPrice: true },
        _count: true,
      }),

      prisma.transactionItem.findMany({
        where: { productId: id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          discountApplied: true,
          createdAt: true,
          transaction: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),

      prisma.salesOrderItem.findMany({
        where: { productId: id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          discount: true,
          createdAt: true,
          salesOrder: {
            select: {
              id: true,
              status: true,
              customer: { select: { name: true } },
            },
          },
        },
      }),

      prisma.inventoryTransaction.findMany({
        where: { productId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          quantity: true,
          notes: true,
          createdAt: true,
        },
      }),

      prisma.productVariant.findMany({
        where: { productId: id, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          sku: true,
          priceAdjustment: true,
          stockQuantity: true,
          isActive: true,
        },
      }),
    ]);

  return { product, salesStats, recentTransactions, recentSalesOrders, inventoryHistory, variants };
}

function getStockStatus(product: { isActive: boolean; stockQuantity: number; reorderLevel: number | null }) {
  if (!product.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  if (product.stockQuantity === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
  if (product.reorderLevel && product.stockQuantity <= product.reorderLevel)
    return { label: 'Low Stock', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
  return { label: 'In Stock', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
}

function getInventoryMovementColor(type: string) {
  const incoming = ['PURCHASE', 'RETURN', 'ADJUSTMENT_IN', 'OPENING_STOCK', 'TRANSFER_IN'];
  const outgoing = ['SALE', 'ADJUSTMENT_OUT', 'DAMAGE', 'TRANSFER_OUT', 'LOSS'];
  if (incoming.includes(type)) return { color: 'text-emerald-700 bg-emerald-50', sign: '+' };
  if (outgoing.includes(type)) return { color: 'text-red-700 bg-red-50', sign: '-' };
  return { color: 'text-slate-700 bg-slate-50', sign: '' };
}

function getSalesOrderStatusStyle(status: string) {
  const styles: Record<string, string> = {
    CONFIRMED: 'bg-blue-50 text-blue-700',
    DELIVERED: 'bg-emerald-50 text-emerald-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-red-50 text-red-700',
    PENDING: 'bg-amber-50 text-amber-700',
  };
  return styles[status] ?? 'bg-slate-100 text-slate-600';
}

function getTransactionStatusStyle(status: string) {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    VOID: 'bg-red-50 text-red-700',
    PENDING: 'bg-amber-50 text-amber-700',
    REFUNDED: 'bg-purple-50 text-purple-700',
  };
  return styles[status] ?? 'bg-slate-100 text-slate-600';
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const { product, salesStats, recentTransactions, recentSalesOrders, inventoryHistory, variants } =
    await getProductData(id);

  if (!product) notFound();

  const price = Number(product.price);
  const costPrice = product.costPrice ? Number(product.costPrice) : null;
  const taxRate = product.taxRate ? Number(product.taxRate) : null;

  const profitMargin = costPrice && costPrice > 0
    ? ((price - costPrice) / costPrice) * 100
    : null;
  const profitPerUnit = costPrice ? price - costPrice : null;

  const totalUnitsSold = salesStats._sum.quantity ?? 0;
  const totalRevenue = Number(salesStats._sum.totalPrice ?? 0);
  const totalTransactions = salesStats._count;

  const stockStatus = getStockStatus({
    isActive: product.isActive,
    stockQuantity: product.stockQuantity,
    reorderLevel: product.reorderLevel,
  });

  const maxStock = Math.max(product.stockQuantity, product.reorderLevel ?? 0, 100);
  const stockPercent = Math.min((product.stockQuantity / maxStock) * 100, 100);
  const reorderPercent = product.reorderLevel ? Math.min((product.reorderLevel / maxStock) * 100, 100) : 0;

  const handleDelete = async () => {
    'use server';
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/products/${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete product');
      redirect('/dashboard/products');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="sm" className="mt-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Products
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900 truncate">{product.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stockStatus.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`} />
              {stockStatus.label}
            </span>
            {!product.isActive && (
              <Badge variant="outline" className="text-slate-500">Inactive</Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            {product.category?.name}
            {product.sku && <> &bull; SKU: <span className="font-mono">{product.sku}</span></>}
            {product.barcode && <> &bull; Barcode: <span className="font-mono">{product.barcode}</span></>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{product.name}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-3">
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stock</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{product.stockQuantity}</p>
          {product.reorderLevel && (
            <p className="text-xs text-slate-400 mt-1">Reorder at {product.reorderLevel}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Units Sold</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalUnitsSold}</p>
          <p className="text-xs text-slate-400 mt-1">{totalTransactions} transactions</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">Total POS sales</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Profit Margin</p>
          </div>
          {profitMargin !== null ? (
            <>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">{formatCurrency(profitPerUnit!)} per unit</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-400">—</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          {product.imageUrl && (
            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              <Image
                src={getOptimizedImageUrl(product.imageUrl, {
                  width: 1200,
                  height: 800,
                  quality: 82,
                  format: 'auto',
                  crop: 'at_max',
                })}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Description */}
          {product.description && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">Selling Price</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(price)}</p>
                </div>
                {costPrice !== null && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Cost Price</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(costPrice)}</p>
                  </div>
                )}
                {taxRate !== null && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Tax Rate</p>
                    <p className="text-xl font-bold text-slate-900">{taxRate.toFixed(2)}%</p>
                  </div>
                )}
              </div>

              {profitMargin !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-slate-600">
                      Profit Margin &mdash; {formatCurrency(profitPerUnit!)} per unit
                    </p>
                    <span className={`text-sm font-bold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${profitMargin >= 30 ? 'bg-emerald-500' : profitMargin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {profitMargin >= 30 ? 'Healthy margin' : profitMargin >= 10 ? 'Moderate margin' : 'Low margin — review pricing'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Box className="h-4 w-4 text-slate-400" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">Current Stock</p>
                  <p className="text-xl font-bold text-slate-900">{product.stockQuantity} units</p>
                </div>
                {product.reorderLevel && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Reorder Level</p>
                    <p className="text-xl font-bold text-slate-900">{product.reorderLevel} units</p>
                  </div>
                )}
              </div>

              {/* Stock Level Visual */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-slate-600">Stock Level</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      product.stockQuantity === 0 ? 'bg-red-500' :
                      product.reorderLevel && product.stockQuantity <= product.reorderLevel ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${stockPercent}%` }}
                  />
                  {reorderPercent > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-600 opacity-60"
                      style={{ left: `${reorderPercent}%` }}
                    />
                  )}
                </div>
                {product.reorderLevel && (
                  <p className="text-xs text-slate-400 mt-1">
                    Reorder threshold at {product.reorderLevel} units
                    {product.forecastedReorderDate && (
                      <> &bull; Est. reorder: {new Date(product.forecastedReorderDate).toLocaleDateString()}</>
                    )}
                  </p>
                )}
              </div>

              {product.predictedDemandImpact && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-800">
                    Predicted demand impact: <span className="font-semibold">{Number(product.predictedDemandImpact).toFixed(2)}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Variants */}
          {variants.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  Variants ({variants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Variant</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">SKU</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Price Adj.</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant) => (
                        <tr key={variant.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{variant.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">{variant.sku ?? '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={Number(variant.priceAdjustment) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {Number(variant.priceAdjustment) >= 0 ? '+' : ''}{formatCurrency(Number(variant.priceAdjustment))}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800">{variant.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent POS Sales */}
          {recentTransactions.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-slate-400" />
                  Recent POS Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Transaction</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Status</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Qty</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Unit Price</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Total</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-500">
                            {item.transaction.id.slice(0, 8)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getTransactionStatusStyle(item.transaction.status)}`}>
                              {item.transaction.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(Number(item.unitPrice))}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(Number(item.totalPrice))}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Sales Orders */}
          {recentSalesOrders.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" />
                  Recent Sales Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Order</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Customer</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Status</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Qty</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Subtotal</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSalesOrders.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <Link
                              href={`/dashboard/sales-orders/${item.salesOrder.id}`}
                              className="font-mono text-xs text-blue-600 hover:underline"
                            >
                              {item.salesOrder.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{item.salesOrder.customer.name}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSalesOrderStatusStyle(item.salesOrder.status)}`}>
                              {item.salesOrder.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(Number(item.subtotal))}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Movement History */}
          {inventoryHistory.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  Inventory Movement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryHistory.map((entry) => {
                    const { color, sign } = getInventoryMovementColor(entry.type);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
                          {sign}{Math.abs(entry.quantity)}
                        </span>
                        <span className="flex-1 text-sm text-slate-700">{entry.type.replace(/_/g, ' ')}</span>
                        {entry.notes && (
                          <span className="text-xs text-slate-400 max-w-[160px] truncate">{entry.notes}</span>
                        )}
                        <span className="text-xs text-slate-400 shrink-0">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Product Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <Badge variant={product.isActive ? 'default' : 'outline'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-800">{product.category?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">SKU</span>
                <span className="font-mono text-xs text-slate-700">{product.sku ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Barcode</span>
                <span className="font-mono text-xs text-slate-700">{product.barcode ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Variants</span>
                <span className="font-medium text-slate-800">{variants.length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">ID</span>
                <span className="font-mono text-xs text-slate-400">{product.id.slice(0, 12)}…</span>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Created</p>
                <p className="font-medium text-slate-800">
                  {new Date(product.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Last Updated</p>
                <p className="font-medium text-slate-800">
                  {new Date(product.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              {product.forecastedReorderDate && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Est. Reorder Date</p>
                  <p className="font-medium text-amber-700">
                    {new Date(product.forecastedReorderDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {(product.aiTags.length > 0 || product.predictedDemandImpact) && (
            <Card className="shadow-sm border-blue-100 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.aiTags.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.aiTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-white">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {product.predictedDemandImpact && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Predicted Demand Impact</p>
                    <p className="text-lg font-bold text-blue-700">
                      {Number(product.predictedDemandImpact).toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/products/${product.id}/edit`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit Product
                </Button>
              </Link>
              <Link href="/dashboard/products" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600">
                  <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                  All Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
