
// components/purchase-orders/purchase-order-form.tsx

'use client';

import { ControllerRenderProps } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { H3 } from '@/components/ui/typography';
import { formatCurrency } from '@/lib/currency';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema } from '@/lib/validations/purchase-order.schema';
import { PurchaseOrder } from '@/types/purchase-order.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product, Supplier } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

type OrderFormValues = z.infer<typeof createPurchaseOrderSchema>;
type UpdateOrderFormValues = z.infer<typeof updatePurchaseOrderSchema>;

interface PurchaseOrderFormProps {
    suppliers: Supplier[];
    products: Product[];
    initialData?: PurchaseOrder;
}

export function PurchaseOrderForm({ suppliers, products, initialData }: PurchaseOrderFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Use appropriate schema based on create or edit mode
    const schema = isEditing ? updatePurchaseOrderSchema : createPurchaseOrderSchema;

    const form = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            supplierId: initialData.supplierId,
            orderDate: new Date(initialData.orderDate),
            status: initialData.status || 'DRAFT',
            items: {
                update: initialData.items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
                    discount: item.discount ? Number(item.discount) : 0,
                })),
            },
        } : {
            supplierId: suppliers.length > 0 ? suppliers[0].id : '',
            orderDate: new Date(),
            status: 'DRAFT',
            items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray<any>({
        control: form.control,
        name: isEditing ? 'items.update' : 'items',
    });

    const watchedItems = useWatch({
        control: form.control,
        name: isEditing ? 'items.update' : 'items',
    }) as any[];

    const totalAmount = (watchedItems || []).reduce((acc, item) => {
        const itemTotal = (item.unitPrice || 0) * (item.quantity || 0) - (item.discount || 0);
        return acc + (itemTotal > 0 ? itemTotal : 0);
    }, 0);

    async function onSubmit(data: any) {
        setIsLoading(true);
        try {
            const url = isEditing ? `/api/purchase-orders/${initialData?.id}` : '/api/purchase-orders';
            const method = isEditing ? 'PUT' : 'POST';

            // For create, use flat items array; for update, already has the right structure
            const payload = isEditing ? data : data;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} purchase order`);
            }

            router.push('/dashboard/purchase-orders');
            router.refresh();
        } catch (error: unknown) {
            const err = error as Error;
            alert(err.message || 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form form={form} as="form">
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <H3>Order Details</H3>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <FormField
                            control={form.control}
                            name="supplierId"
                            render={({ field }) => {
                                const selectedSupplier = suppliers.find(s => s.id === field.value);
                                return (
                                    <FormItem>
                                        <FormLabel>Supplier</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a supplier">
                                                    {selectedSupplier ? selectedSupplier.name : 'Select a supplier'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <FormField
                            control={form.control}
                            name="orderDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order Date</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="date" 
                                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => {
                                const statusLabels: { [key: string]: string } = {
                                    'DRAFT': 'Draft',
                                    'CONFIRMED': 'Confirmed',
                                    'PARTIALLY_RECEIVED': 'Partially Received',
                                    'RECEIVED': 'Received',
                                    'CANCELLED': 'Cancelled',
                                };
                                return (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || 'DRAFT'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a status">
                                                    {statusLabels[field.value] || 'Select a status'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DRAFT">Draft</SelectItem>
                                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                                <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                                                <SelectItem value="RECEIVED">Received</SelectItem>
                                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <H3>Order Items</H3>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-3 items-start border border-slate-200 p-3 rounded-lg">
                                <FormField
                                    control={form.control}
                                    name={isEditing ? `items.update.${index}.productId` : `items.${index}.productId`}
                                    render={({ field }) => {
                                        const selectedProduct = products.find(p => p.id === field.value);
                                        return (
                                            <FormItem className="col-span-4">
                                                <FormLabel>Product</FormLabel>
                                                <Select onValueChange={(value) => {
                                                    field.onChange(value);
                                                    const product = products.find(p => p.id === value);
                                                    if (product) {
                                                        form.setValue(`items.${index}.unitPrice`, Number(product.costPrice) || 0);
                                                    }
                                                }} value={field.value || ''}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product">
                                                            {selectedProduct ? selectedProduct.name : 'Select a product'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                {product.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField
                                    control={form.control}
                                    name={isEditing ? `items.update.${index}.quantity` : `items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={isEditing ? `items.update.${index}.unitPrice` : `items.${index}.unitPrice`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Unit Price</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={isEditing ? `items.update.${index}.discount` : `items.${index}.discount`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Discount</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="col-span-2 flex items-end h-full">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0 })}
                        >
                            Add Item
                        </Button>
                    </CardContent>
                </Card>

                <div className="text-right text-2xl font-semibold text-slate-900">
                    Total: {formatCurrency(totalAmount)}
                </div>

                <Button type="submit" disabled={isLoading} className="self-start">
                    {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Order' : 'Create Order')}
                </Button>
            </form>
        </Form>
    );
}