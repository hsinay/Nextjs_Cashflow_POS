// app/dashboard/purchase-orders/[id]/edit/page.tsx

import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import { Body, H1 } from '@/components/ui/typography';
import { authOptions } from '@/lib/auth';
import { Colors } from '@/lib/design-tokens';
import { prisma } from '@/lib/prisma';
import { getPurchaseOrderById } from '@/services/purchase-order.service';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

interface EditPurchaseOrderPageProps {
    params: {
        id: string;
    };
}

async function getInitialData(orderId: string) {
    const [order, suppliers, products] = await Promise.all([
        getPurchaseOrderById(orderId),
        prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

    if (!order) {
        notFound();
    }

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

    return { order, convertedSuppliers, convertedProducts };
}

export default async function EditPurchaseOrderPage({ params }: EditPurchaseOrderPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const { order, convertedSuppliers, convertedProducts } = await getInitialData(params.id);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <H1>Edit Purchase Order #{order.id.substring(0, 8)}</H1>
                <Body style={{ color: Colors.text.secondary, marginTop: '8px' }}>Update the details of the purchase order.</Body>
            </div>
            <PurchaseOrderForm suppliers={convertedSuppliers} products={convertedProducts} initialData={order} />
        </div>
    );
}
