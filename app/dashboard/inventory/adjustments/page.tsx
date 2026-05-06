// app/dashboard/inventory/adjustments/page.tsx

import { AdjustmentForm } from '@/components/inventory/adjustment-form';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

function convertDecimals(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Prisma.Decimal) return obj.toNumber();
    if (Array.isArray(obj)) return obj.map(convertDecimals);
    if (typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, convertDecimals(v)]));
    }
    return obj;
}

async function getProducts() {
    const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return convertDecimals(products);
}

export default async function InventoryAdjustmentsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const products = await getProducts();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Manual Inventory Adjustment</h1>
                <p className="text-gray-600 mt-1">Adjust product stock levels manually.</p>
            </div>
            <AdjustmentForm products={products} />
        </div>
    );
}
