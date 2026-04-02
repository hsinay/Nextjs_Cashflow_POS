// app/dashboard/purchase-orders/new/page.tsx

import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import { Body, H1 } from '@/components/ui/typography';
import { authOptions } from '@/lib/auth';
import { Colors } from '@/lib/design-tokens';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

async function getSuppliersAndProducts() {
    const [suppliers, products] = await Promise.all([
        prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

    // Convert Decimal fields in suppliers - cast as any to bypass type check
    const convertedSuppliers = suppliers.map(s => ({
        ...s,
        creditLimit: s.creditLimit?.toNumber() !== undefined ? s.creditLimit?.toNumber() : 0,
        outstandingBalance: s.outstandingBalance?.toNumber() !== undefined ? s.outstandingBalance?.toNumber() : 0,
    })) as any;

    // Convert Decimal fields in products - cast as any to bypass type check
    const convertedProducts = products.map(p => ({
        ...p,
        price: p.price.toNumber(),
        costPrice: p.costPrice?.toNumber() || null,
        taxRate: p.taxRate?.toNumber() || null,
    })) as any;

    return { convertedSuppliers, convertedProducts };
}

export default async function NewPurchaseOrderPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const { convertedSuppliers, convertedProducts } = await getSuppliersAndProducts();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <H1>New Purchase Order</H1>
                <Body style={{ color: Colors.text.secondary, marginTop: '8px' }}>Create a new purchase order for a supplier.</Body>
            </div>
            <PurchaseOrderForm suppliers={convertedSuppliers} products={convertedProducts} />
        </div>
    );
}
