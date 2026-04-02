// components/pos/pos-client.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { PaymentDetailInput } from '@/types/pos-payment.types';
import { POSSession } from '@/types/pos.types';
import { Customer, Product } from '@prisma/client';
import { Image as ImageIcon, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { POSPaymentPanel } from './pos-payment-panel';

interface POSClientProps {
    initialSession: POSSession | null;
    products: (Product & { price: number, costPrice: number | null, taxRate: number | null })[];
    customers: Customer[];
    cashierId: string;
}

interface CartItem {
    product: Product & { price: number, costPrice: number | null, taxRate: number | null };
    quantity: number;
    unitPrice: number;
    discount: number;
}

export function POSClient({ initialSession, products, customers: _customers, cashierId }: POSClientProps) {
    const [session, setSession] = useState<POSSession | null>(initialSession);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionInitialized, setSessionInitialized] = useState(!!initialSession);
    const [isPaymentPanelOpen, setIsPaymentPanelOpen] = useState(false);
    const { toast } = useToast();

    // Auto-open session on component mount if no session exists
    useEffect(() => {
        const autoOpenSession = async () => {
            if (!session && !sessionInitialized) {
                try {
                    const response = await fetch('/api/pos/sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cashierId, openingCashAmount: 0 }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSession(data.data);
                    }
                } catch (error) {
                    console.error('Error auto-opening session:', error);
                } finally {
                    setSessionInitialized(true);
                }
            }
        };

        autoOpenSession();
    }, []);

    // Filter products based on search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discount), 0);
    const totalTax = cart.reduce((sum, item) => {
        const itemTotal = item.unitPrice * item.quantity - item.discount;
        const taxRate = (item.product.taxRate || 0) / 100;
        return sum + (itemTotal * taxRate);
    }, 0);
    const totalAmount = subtotal + totalTax;

    // Handlers for session management
    const handleOpenSession = async (openingCash: number) => {
        try {
            const response = await fetch('/api/pos/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cashierId, openingCashAmount: openingCash }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to open session');
            }
            const data = await response.json();
            setSession(data.data);
            toast({ title: 'Success', description: 'POS session started successfully.' });
        } catch (error: unknown) {
            console.error('Error opening session:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to open session.';
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        }
    };

    const handleCloseSession = async (closingCash: number) => {
        if (!session?.id) return;
        try {
            const response = await fetch(`/api/pos/sessions/${session.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLOSED', closingCashAmount: closingCash }),
            });
            if (!response.ok) throw new Error('Failed to close session');
            const data = await response.json();
            setSession(data.data);
            toast({ title: 'Success', description: 'POS session ended successfully.' });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to close session.';
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        }
    };

    // Cart management handlers
    const handleAddToCart = (product: Product & { price: number, costPrice: number | null, taxRate: number | null }, quantity: number = 1) => {
        const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
        if (existingItemIndex > -1) {
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity += quantity;
            setCart(updatedCart);
        } else {
            setCart([...cart, { product, quantity, unitPrice: product.price, discount: 0 }]);
        }
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            handleRemoveFromCart(productId);
            return;
        }
        const updatedCart = cart.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
        );
        setCart(updatedCart);
    };

    const handleRemoveFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const handleClearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
    };

    // Payment handler - NEW: Opens payment panel
    const handleOpenPaymentPanel = () => {
        if (!session?.id || session.status !== 'OPEN') {
            toast({ title: 'Error', description: 'No active POS session. Please open a session first.', variant: 'destructive' });
            return;
        }
        if (cart.length === 0) {
            toast({ title: 'Error', description: 'Cart is empty. Add items before processing.', variant: 'destructive' });
            return;
        }
        setIsPaymentPanelOpen(true);
    };

    // Handle payment confirmation from panel
    const handleConfirmPayment = async (paymentData: PaymentDetailInput) => {
        setIsProcessingPayment(true);
        try {
            const transactionNumber = `TRX-${Date.now()}`;
            const transactionData = {
                transactionNumber,
                cashierId,
                sessionId: session!.id,
                customerId: paymentData.customerId || selectedCustomer?.id,
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountApplied: item.discount,
                    taxRate: item.product.taxRate || 0,
                })),
                paymentDetails: [{ 
                    paymentMethod: paymentData.paymentMethod, 
                    amount: paymentData.amount 
                }],
            };

            const response = await fetch('/api/pos/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Transaction failed:', error);
                throw new Error(error.error || 'Failed to process transaction');
            }

            toast({ 
                title: 'Success', 
                description: `Transaction ${transactionNumber} completed successfully.` 
            });
            handleClearCart();
            setSession(prev => prev ? { ...prev, totalSalesAmount: (prev.totalSalesAmount || 0) + totalAmount } : null);
            setIsPaymentPanelOpen(false);
        } catch (error: unknown) {
            throw error;
        } finally {
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
            {/* Products Section */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto">
                {/* Session Status Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                {!session || session.status === 'CLOSED' ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">No active session</p>
                                        <Button onClick={() => handleOpenSession(0)} size="sm" className="bg-green-600 hover:bg-green-700">
                                            Open New Session
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Session: <span className="font-bold text-green-600">{session.id.substring(0, 8)}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Status: Active</p>
                                    </div>
                                )}
                            </div>
                            {session && session.status === 'OPEN' && (
                                <Button onClick={() => handleCloseSession(0)} variant="destructive" size="sm">
                                    Close Session
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Product Search */}
                <div>
                    <Input
                        placeholder="Search products by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Product Grid - Odoo Style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleAddToCart(product)}
                        >
                            {/* Product Image */}
                            <div className="relative bg-gray-100 h-40 flex items-center justify-center overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                        <ImageIcon className="w-8 h-8" />
                                        <span className="text-xs">No image</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-3">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {product.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    SKU: {product.sku || 'N/A'}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-lg font-bold text-blue-600">
                                        {formatCurrency(product.price)}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        product.stockQuantity > 0 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No products found</p>
                    </div>
                )}
            </div>

            {/* Shopping Cart Section */}
            <div className="lg:col-span-1 flex flex-col h-screen bg-white border-l border-gray-200">
                <Card className="flex-1 flex flex-col border-0 rounded-0">
                    <CardHeader className="border-b">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            <CardTitle>Cart ({cart.length})</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto py-4">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Cart is empty</p>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div
                                        key={item.product.id}
                                        className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex gap-3 mb-2">
                                            {/* Product Image */}
                                            {item.product.imageUrl ? (
                                                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded border border-gray-300 overflow-hidden">
                                                    <img
                                                        src={item.product.imageUrl}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                            
                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item.product.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatCurrency(item.unitPrice)} each
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveFromCart(item.product.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="text-sm font-medium w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">
                                                {formatCurrency(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {/* Cart Summary */}
                    <div className="border-t p-4 space-y-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax:</span>
                                <span>{formatCurrency(totalTax)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                                <span>Total:</span>
                                <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                            {!session || session.status === 'CLOSED' ? (
                                <Button
                                    onClick={() => handleOpenSession(0)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-lg"
                                >
                                    Open Session to Start
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleOpenPaymentPanel}
                                    disabled={isProcessingPayment || cart.length === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessingPayment ? 'Processing...' : `Process Payment (${formatCurrency(totalAmount)})`}
                                </Button>
                            )}
                            <Button
                                onClick={handleClearCart}
                                variant="outline"
                                className="w-full"
                                disabled={cart.length === 0}
                            >
                                Clear Cart
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Payment Panel Modal */}
            <POSPaymentPanel
                isOpen={isPaymentPanelOpen}
                orderTotal={totalAmount}
                orderSubtotal={subtotal}
                orderTax={totalTax}
                customers={(_customers as any[])} // Cast to bypass Decimal type from DB
                selectedCustomer={(selectedCustomer as any) || null} // Cast to bypass Decimal type from DB
                onSelectCustomer={(setSelectedCustomer as any)} // Cast to bypass DB entity difference
                onConfirmPayment={handleConfirmPayment}
                onClose={() => setIsPaymentPanelOpen(false)}
            />
        </div>
    );
}
