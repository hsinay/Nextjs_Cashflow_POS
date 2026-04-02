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

    // Fetch all active products and customers for the POS interface
    const [products, customers] = await Promise.all([
        prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

    // Convert Prisma Decimal to number for client-side usage
    const serializedProducts = products.map(p => ({
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
                customers={customers}
                cashierId={cashierId}
            />
        </div>
    );
}
