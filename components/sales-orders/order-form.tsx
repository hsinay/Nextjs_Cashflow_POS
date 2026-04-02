// components/sales-orders/order-form.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import { createSalesOrderSchema, editSalesOrderFormSchema } from '@/lib/validations/sales-order.schema';
import { SalesOrder } from '@/types/sales-order.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Customer, Product } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

type OrderFormValues = z.infer<typeof createSalesOrderSchema> & {
    paymentAmount?: number;
    paymentMethod?: string;
    paymentDate?: Date;
    paymentNotes?: string;
};

interface OrderFormProps {
    customers: Customer[];
    products: Product[];
    initialData?: SalesOrder;
}

export function OrderForm({ customers, products, initialData }: OrderFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isEditing = !!initialData;

    const schema = isEditing ? editSalesOrderFormSchema : createSalesOrderSchema;

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(schema as any),
        defaultValues: initialData ? {
            customerId: initialData.customerId,
            status: initialData.status as any,
            orderDate: new Date(initialData.orderDate),
            items: initialData.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
                discount: item.discount ? Number(item.discount) : 0,
            })),
        } : {
            customerId: '',
            orderDate: new Date(),
            status: 'DRAFT' as const,
            items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
        },
    });

    // Watch the status field to show payment fields
    const watchedStatus = useWatch({
        control: form.control,
        name: 'status',
    });

    const { fields, append, remove } = useFieldArray<OrderFormValues>({
        control: form.control,
        name: 'items',
    });

    const watchedItems = useWatch({
        control: form.control,
        name: 'items',
    }) as OrderFormValues['items'];

    const totalAmount = (watchedItems || []).reduce((acc, item) => {
        const itemTotal = (item.unitPrice || 0) * (item.quantity || 0) - (item.discount || 0);
        return acc + (itemTotal > 0 ? itemTotal : 0);
    }, 0);

    async function onSubmit(data: OrderFormValues) {
        // Don't submit if a dropdown is open
        if (isDropdownOpen) {
            return;
        }
        setIsLoading(true);
        try {
            const url = isEditing ? `/api/sales-orders/${initialData?.id}` : '/api/sales-orders';
            const method = isEditing ? 'PUT' : 'POST';

            // For updates, transform data to match updateSalesOrderSchema
            let payload: any = data;
            if (isEditing && initialData) {
                // Build the items structure for updates
                const itemUpdates = [];
                const itemCreates = [];
                const itemsToDelete = [];
                
                // Track which original items were updated
                const updatedItemIds = new Set<string>();
                
                for (const formItem of data.items) {
                    // Find matching item by exact product/quantity match or by position
                    const existingItem = initialData.items.find(
                        orig => orig.productId === formItem.productId && orig.quantity === formItem.quantity
                    ) || initialData.items.find(
                        orig => orig.productId === formItem.productId
                    );
                    
                    if (existingItem) {
                        // This is an update
                        updatedItemIds.add(existingItem.id);
                        itemUpdates.push({
                            id: existingItem.id,
                            quantity: formItem.quantity,
                            unitPrice: formItem.unitPrice,
                            discount: formItem.discount,
                        });
                    } else {
                        // This is a new item
                        itemCreates.push(formItem);
                    }
                }
                
                // Mark items that weren't included in the form as deleted
                for (const originalItem of initialData.items) {
                    if (!updatedItemIds.has(originalItem.id)) {
                        itemsToDelete.push(originalItem.id);
                    }
                }
                
                const itemsPayload: any = {};
                if (itemUpdates.length > 0) itemsPayload.update = itemUpdates;
                if (itemCreates.length > 0) itemsPayload.create = itemCreates;
                if (itemsToDelete.length > 0) itemsPayload.delete = itemsToDelete;
                
                payload = {
                    orderDate: data.orderDate,
                    status: data.status,
                    ...(Object.keys(itemsPayload).length > 0 && { items: itemsPayload })
                };

                // Add payment data if status is PAID or PARTIALLY_PAID
                if (((data.status as any) === 'PAID' || (data.status as any) === 'PARTIALLY_PAID') && (data as any).paymentAmount) {
                    payload.payment = {
                        amount: (data as any).paymentAmount,
                        paymentMethod: (data as any).paymentMethod,
                        paymentDate: (data as any).paymentDate,
                        notes: (data as any).paymentNotes,
                    };
                }
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('API Error:', error);
                throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} sales order`);
            }

            router.push('/dashboard/sales-orders');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        // Prevent form submission when Enter is pressed inside a Select/Dropdown
        if (e.key === 'Enter') {
            const activeElement = document.activeElement as HTMLElement;
            // Check if in a dropdown/select component
            const inSelectDropdown = 
                activeElement?.getAttribute('role') === 'combobox' || 
                activeElement?.getAttribute('role') === 'listbox' ||
                activeElement?.getAttribute('role') === 'option' ||
                activeElement?.closest('[role="listbox"]') ||
                activeElement?.closest('[role="combobox"]') ||
                document.querySelector('[role="listbox"]')?.contains(activeElement);
            
            if (inSelectDropdown) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
    };

    const handleStatusChange = (value: string) => {
        form.setValue('status', value as any);
    };

    const handleFormClick = (e: React.MouseEvent<HTMLFormElement>) => {
        // Check if clicking on or within a Select component
        const target = e.target as HTMLElement;
        const isSelectElement = 
            target.getAttribute('role') === 'combobox' || 
            target.getAttribute('role') === 'listbox' ||
            target.getAttribute('role') === 'option' ||
            target.closest('[role="combobox"]') ||
            target.closest('[role="listbox"]') ||
            target.closest('[class*="Select"]');
        
        // Don't prevent default for select interactions
        if (isSelectElement) {
            e.stopPropagation();
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} onClick={handleFormClick} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="customerId"
                            render={({ field }) => {
                                const selectedCustomer = customers.find(c => c.id === field.value);
                                return (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <FormControl>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value || ''}
                                                onOpenChange={setIsDropdownOpen}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a customer">
                                                        {selectedCustomer ? selectedCustomer.name : 'Select a customer'}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id}>
                                                            {customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <FormField
                            control={form.control as any}
                            name="orderDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="status"
                            render={({ field }) => {
                                const statusLabel: { [key: string]: string } = {
                                    'DRAFT': 'Draft',
                                    'CONFIRMED': 'Confirmed',
                                    'PARTIALLY_PAID': 'Partially Paid',
                                    'PAID': 'Paid',
                                    'CANCELLED': 'Cancelled',
                                };
                                return (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            <Select 
                                                onValueChange={handleStatusChange} 
                                                value={String(field.value) || 'DRAFT'}
                                                onOpenChange={setIsDropdownOpen}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue>
                                                        {statusLabel[String(field.value)] || 'Select status'}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                                    {isEditing && (
                                                        <>
                                                            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                                                            <SelectItem value="PAID">Paid</SelectItem>
                                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-start border p-4 rounded-md">
                                <FormField
                                    control={form.control as any}
                                    name={`items.${index}.productId`}
                                    render={({ field }) => {
                                        const selectedProduct = products.find(p => p.id === field.value);
                                        return (
                                            <FormItem className="col-span-4">
                                                <FormLabel>Product</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={(value) => {
                                                        field.onChange(value);
                                                        const product = products.find(p => p.id === value);
                                                        if (product) {
                                                            form.setValue(`items.${index}.unitPrice`, Number(product.price) || 0);
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
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField
                                    control={form.control as any}
                                    name={`items.${index}.quantity`}
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
                                    control={form.control as any}
                                    name={`items.${index}.unitPrice`}
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
                                    control={form.control as any}
                                    name={`items.${index}.discount`}
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

                {/* Payment Fields - Only show if status is PAID or PARTIALLY_PAID */}
                {isEditing && ((watchedStatus as any) === 'PAID' || (watchedStatus as any) === 'PARTIALLY_PAID') && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-green-900">Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control as any}
                                name="paymentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={formatCurrency(totalAmount).replace(/[^\d.]/g, '')}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="paymentMethod"
                                render={({ field }) => {
                                    const methodLabel: { [key: string]: string } = {
                                        'CASH': 'Cash',
                                        'BANK_TRANSFER': 'Bank Transfer',
                                        'CARD': 'Card',
                                        'UPI': 'UPI',
                                        'CHEQUE': 'Cheque',
                                        'DIGITAL_WALLET': 'Digital Wallet',
                                        'CREDIT': 'Credit',
                                        'DEBIT': 'Debit',
                                        'MOBILE_WALLET': 'Mobile Wallet',
                                    };
                                    return (
                                        <FormItem>
                                            <FormLabel>Payment Method</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || ''}
                                                    onOpenChange={setIsDropdownOpen}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue>
                                                            {field.value ? methodLabel[field.value] : 'Select payment method'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CASH">Cash</SelectItem>
                                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                        <SelectItem value="CARD">Card</SelectItem>
                                                        <SelectItem value="UPI">UPI</SelectItem>
                                                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                                                        <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                                                        <SelectItem value="CREDIT">Credit</SelectItem>
                                                        <SelectItem value="DEBIT">Debit</SelectItem>
                                                        <SelectItem value="MOBILE_WALLET">Mobile Wallet</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            <FormField
                                control={form.control as any}
                                name="paymentDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="paymentNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Add any notes about this payment..." {...field} rows={2} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                <div className="text-right text-2xl font-bold">
                    Total: {formatCurrency(totalAmount)}
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Order' : 'Create Order')}
                </Button>
            </form>
        </Form>
    );
}
