// app/dashboard/inventory/adjustments/page.tsx

import { AdjustmentForm } from '@/components/inventory/adjustment-form';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

async function getProducts() {
    return prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
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
