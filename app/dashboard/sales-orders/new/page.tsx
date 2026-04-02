// app/dashboard/sales-orders/new/page.tsx

import { OrderForm } from '@/components/sales-orders/order-form';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

async function getCustomersAndProducts() {
    const [customers, products] = await Promise.all([
        prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

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

    return { convertedCustomers, convertedProducts };
}

export default async function NewSalesOrderPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const { convertedCustomers, convertedProducts } = await getCustomersAndProducts();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">New Sales Order</h1>
                <p className="text-gray-600 mt-1">Create a new order for a customer.</p>
            </div>
            <OrderForm customers={convertedCustomers} products={convertedProducts} />
        </div>
    );
}
