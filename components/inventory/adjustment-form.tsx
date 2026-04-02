// components/inventory/adjustment-form.tsx

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@prisma/client';
import { createInventoryTransactionSchema } from '@/lib/validations/inventory.schema';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INVENTORY_TRANSACTION_TYPES } from '@/types/inventory.types';
import { Textarea } from '@/components/ui/textarea';

type AdjustmentFormValues = z.infer<typeof createInventoryTransactionSchema>;

interface AdjustmentFormProps {
    products: Product[];
}

export function AdjustmentForm({ products }: AdjustmentFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<AdjustmentFormValues>({
        resolver: zodResolver(createInventoryTransactionSchema),
        defaultValues: {
            productId: '',
            transactionType: 'ADJUSTMENT',
            quantity: 0,
            notes: '',
            transactionDate: new Date(),
        },
    });

    async function onSubmit(data: AdjustmentFormValues) {
        setIsLoading(true);
        try {
            const response = await fetch('/api/inventory-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create adjustment');
            }

            router.push('/dashboard/inventory/transactions');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Adjustment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="productId"
                            render={({ field }) => {
                                const selectedProduct = products.find(p => p.id === field.value);
                                return (
                                    <FormItem>
                                        <FormLabel>Product</FormLabel>
                                        <Select
                                          value={field.value}
                                          onValueChange={(value) => field.onChange(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a product">
                                                    {selectedProduct ? selectedProduct.name : 'Select a product'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Select a product</SelectItem>
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
                            control={form.control as any}
                            name="transactionType"
                            render={({ field }) => {
                                const typeLabel: { [key: string]: string } = {
                                    'ADJUSTMENT': 'Adjustment',
                                    'RESTOCK': 'Restock',
                                    'RETURN': 'Return',
                                    'DAMAGE': 'Damage',
                                };
                                return (
                                    <FormItem>
                                        <FormLabel>Transaction Type</FormLabel>
                                        <Select
                                          value={field.value}
                                          onValueChange={(value) => field.onChange(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a type">
                                                    {field.value ? typeLabel[field.value] || field.value.replace('_', ' ') : 'Select a type'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Select a type</SelectItem>
                                                {INVENTORY_TRANSACTION_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type.replace('_', ' ')}
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
                            control={form.control as any}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
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
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="transactionDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating Adjustment...' : 'Create Adjustment'}
                </Button>
            </form>
        </Form>
    );
}
