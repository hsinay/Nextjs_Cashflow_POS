// app/(dashboard)/products/page.tsx

import { ProductListClient } from '@/components/products/product-list-client';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface ProductsPageProps {
  searchParams: {
    search?: string;
    category?: string;
    page?: string;
    limit?: string;
  };
}

async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  try {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '10');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isActive: true,
    };

    if (searchParams.search) {
      whereClause.OR = [
        { name: { contains: searchParams.search, mode: 'insensitive' } },
        { sku: { contains: searchParams.search, mode: 'insensitive' } },
        { barcode: { contains: searchParams.search, mode: 'insensitive' } },
      ];
    }

    if (searchParams.category) {
      whereClause.categoryId = searchParams.category;
    }

    const [rawProducts, total] = await Promise.all([ // Renamed to rawProducts
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const products = rawProducts.map(product => ({
        ...product,
        price: product.price.toNumber(),
        costPrice: product.costPrice !== null ? product.costPrice.toNumber() : null,
        taxRate: product.taxRate !== null ? product.taxRate.toNumber() : null,
        // Add other Decimal fields if necessary
    }));

    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return {
      products,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const { products, categories, pagination } = await getProducts(searchParams);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-2">
            Manage your product inventory
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <ProductListClient
        initialSearch={searchParams.search || ''}
        initialCategory={searchParams.category || ''}
        categories={categories}
        products={products}
        pagination={pagination}
      />
    </div>
  );
}
