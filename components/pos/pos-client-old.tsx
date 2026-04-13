// components/pos/pos-client.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { PaymentDetailInput } from '@/types/pos-payment.types';
import { POSSession } from '@/types/pos.types';
import { Category, Customer, Product } from '@prisma/client';
import { ChevronDown, Image as ImageIcon, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { POSPaymentPanel } from './pos-payment-panel';

interface POSClientProps {
    initialSession: POSSession | null;
    products: (Product & { category: any, price: number, costPrice: number | null, taxRate: number | null })[];
    categories: Category[];
    customers: Customer[];
    cashierId: string;
}

interface CartItem {
    product: Product & { category: any, price: number, costPrice: number | null, taxRate: number | null };
    quantity: number;
    unitPrice: number;
    discount: number;
}

export function POSClient({ initialSession, products, categories, customers: _customers, cashierId }: POSClientProps) {
    const [session, setSession] = useState<POSSession | null>(initialSession);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
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

    // Filter products based on search and selected category
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });

    // Group filtered products by category
    const groupedProducts = categories.map(cat => ({
        category: cat,
        products: filteredProducts.filter(p => p.categoryId === cat.id)
    })).filter(group => group.products.length > 0);

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
    const handleAddToCart = (product: Product & { category: any, price: number, costPrice: number | null, taxRate: number | null }, quantity: number = 1) => {
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
        <div className="flex flex-col h-full bg-gray-50">
            {/* Session Header - Compact */}
            <div className="flex-shrink-0 bg-white border-b px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {!session || session.status === 'CLOSED' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 bg-red-100 text-red-700 px-2 py-1 rounded">
                                No Session
                            </span>
                            <Button onClick={() => handleOpenSession(0)} size="xs" className="bg-green-600 hover:bg-green-700 h-6">
                                Open Session
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-600">
                                Session: <span className="font-bold text-green-600">{session.id.substring(0, 8)}</span>
                            </span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                                Active
                            </span>
                            <Button onClick={() => handleCloseSession(0)} variant="destructive" size="xs" className="h-6">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    {new Date().toLocaleString()}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 overflow-hidden">
                {/* Products Section */}
                <div className="lg:col-span-3 flex flex-col gap-0 bg-white overflow-hidden border-r">
                    {/* Search and Category Filter */}
                    <div className="flex-shrink-0 p-4 border-b bg-gray-50">
                        {/* Category Filter Tabs and Search */}
                        <div className="flex gap-3 items-center">
                            {/* Category Filter Tabs */}
                            <div className="flex gap-2 overflow-x-auto flex-1 pb-2">
                                <Button
                                    onClick={() => setSelectedCategoryId(null)}
                                    variant={!selectedCategoryId ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs whitespace-nowrap"
                                >
                                    All Products
                                </Button>
                                {categories.filter(cat => products.some(p => p.categoryId === cat.id)).map(cat => (
                                    <Button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                                        variant={selectedCategoryId === cat.id ? "default" : "outline"}
                                        size="sm"
                                        className="text-xs whitespace-nowrap"
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-48 flex-shrink-0"
                            />
                        </div>
                    </div>

                    {/* Product Grid - Grouped by Category if not filtered */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {selectedCategoryId ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {groupedProducts.map(group => (
                                    <div key={group.category.id} className="space-y-2">
                                        <h3 className="text-sm font-bold text-gray-900 px-2 py-1 bg-gray-100 rounded">
                                            {group.category.name}
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {group.products.map(product => (
                                                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-sm">No products found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Shopping Cart Section - Maximized */}
                <div className="lg:col-span-1 flex flex-col h-full bg-white border-l">
                    {/* Cart Header */}
                    <div className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-gray-900">Cart ({cart.length})</span>
                        </div>
                        {cart.length > 0 && (
                            <Button
                                onClick={handleClearCart}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Cart Items - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-8">Cart is empty</p>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <CartItemRow key={item.product.id} item={item} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Summary and Actions */}
                    <div className="flex-shrink-0 border-t p-4 space-y-3 bg-gray-50">
                        {/* Summary */}
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax:</span>
                                <span className="font-medium">{formatCurrency(totalTax)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t">
                                <span>Total:</span>
                                <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                            {!session || session.status === 'CLOSED' ? (
                                <Button
                                    onClick={() => handleOpenSession(0)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 text-sm rounded-lg"
                                >
                                    Open Session
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleOpenPaymentPanel}
                                    disabled={isProcessingPayment || cart.length === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessingPayment ? 'Processing...' : `Pay (${formatCurrency(totalAmount)})`}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Panel Modal */}
            <POSPaymentPanel
                isOpen={isPaymentPanelOpen}
                orderTotal={totalAmount}
                orderSubtotal={subtotal}
                orderTax={totalTax}
                customers={(_customers as any[])}
                selectedCustomer={(selectedCustomer as any) || null}
                onSelectCustomer={(setSelectedCustomer as any)}
                onConfirmPayment={handleConfirmPayment}
                onClose={() => setIsPaymentPanelOpen(false)}
            />
        </div>
    );
}

// Product Card Component
interface ProductCardProps {
    product: Product & { category: any, price: number, costPrice: number | null, taxRate: number | null };
    onAddToCart: (product: Product & { category: any, price: number, costPrice: number | null, taxRate: number | null }) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
    return (
        <div
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onAddToCart(product)}
        >
            <div className="relative bg-gray-100 h-32 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="p-2">
                <h3 className="text-xs font-medium text-gray-900 truncate">
                    {product.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 truncate">
                    {product.sku || 'N/A'}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(product.price)}
                    </span>
                    <span className={`text-xs px-1 py-0.5 rounded ${
                        product.stockQuantity > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {product.stockQuantity > 0 ? product.stockQuantity : '0'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Cart Item Row Component
interface CartItemRowProps {
    item: CartItem;
    onRemove: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
}

function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
    return (
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs">
            <div className="flex gap-2 mb-1">
                {item.product.imageUrl ? (
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded border border-gray-300 overflow-hidden">
                        <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                )}
                
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                        {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice)} each
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.product.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 flex-shrink-0"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                    >
                        <Minus className="w-2.5 h-2.5" />
                    </Button>
                    <span className="text-xs font-medium w-6 text-center">
                        {item.quantity}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                    >
                        <Plus className="w-2.5 h-2.5" />
                    </Button>
                </div>
                <span className="text-xs font-bold text-gray-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                </span>
            </div>
        </div>
    );
}
