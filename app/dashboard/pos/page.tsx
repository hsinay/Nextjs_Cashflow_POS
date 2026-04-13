// app/dashboard/pos/page.tsx

import { POSClient } from '@/components/pos/pos-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLatestOpenPOSSessionByCashierId } from '@/services/pos.service';
import { Product } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function POSPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const cashierId = session.user.id;
    const initialSession = await getLatestOpenPOSSessionByCashierId(cashierId);

    // Fetch all active products with category relation and customers
    // Note: Categories are extracted from products, avoiding N+1 query
    const [productsRaw, customers] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          include: { category: true },
          orderBy: { name: 'asc' }
        }),
        prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

    // Extract unique categories from products to avoid separate query
    const categoryMap = new Map();
    productsRaw.forEach(product => {
      if (product.category && !categoryMap.has(product.category.id)) {
        categoryMap.set(product.category.id, product.category);
      }
    });
    const categories = Array.from(categoryMap.values());

    // Convert Prisma Decimal to number for client-side usage
    const serializedProducts = productsRaw.map(p => ({
      ...p,
      price: p.price.toNumber(),
      costPrice: p.costPrice?.toNumber() || null,
      taxRate: p.taxRate?.toNumber() || null,
    })) as (Product & { price: number, costPrice: number | null, taxRate: number | null })[];


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-900">Point of Sale</h1>
                <p className="text-slate-600 mt-2">Process transactions quickly and efficiently.</p>
            </div>

            <POSClient
                initialSession={initialSession}
                products={serializedProducts}
                categories={categories}
                customers={customers}
                cashierId={cashierId}
            />
        </div>
    );
}
