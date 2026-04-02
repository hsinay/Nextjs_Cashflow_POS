// app/dashboard/sales-orders/[id]/edit/page.tsx

import { OrderForm } from '@/components/sales-orders/order-form';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSalesOrderById } from '@/services/sales-order.service';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

interface EditSalesOrderPageProps {
    params: {
        id: string;
    };
}

async function getInitialData(orderId: string) {
    const [order, customers, products] = await Promise.all([
        getSalesOrderById(orderId),
        prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

    if (!order) {
        notFound();
    }

    // Convert Decimal fields in customers - cast as any to bypass type check
    const convertedCustomers = customers.map(c => ({
        ...c,
        creditLimit: c.creditLimit?.toNumber() !== undefined ? c.creditLimit?.toNumber() : 0,
        outstandingBalance: c.outstandingBalance?.toNumber() !== undefined ? c.outstandingBalance?.toNumber() : 0,
    })) as any;

    // Convert Decimal fields in products - cast as any to bypass type check
    const convertedProducts = products.map(p => ({
        ...p,
        price: p.price.toNumber(),
        costPrice: p.costPrice?.toNumber() || null,
        taxRate: p.taxRate?.toNumber() || null,
    })) as any;

    return { order, convertedCustomers, convertedProducts };
}

export default async function EditSalesOrderPage({ params }: EditSalesOrderPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const { order, convertedCustomers, convertedProducts } = await getInitialData(params.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Sales Order #{order.id.substring(0, 8)}</h1>
                <p className="text-gray-600 mt-1">Update the details of the sales order.</p>
            </div>
            <OrderForm customers={convertedCustomers} products={convertedProducts} initialData={order} />
        </div>
    );
}
