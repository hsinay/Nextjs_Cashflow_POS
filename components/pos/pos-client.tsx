// components/pos/pos-client.tsx - Phase 1 & Phase 2 Implementation
// Phase 1: Collapsible sidebar, Barcode scanner, Advanced filters, Infinite scroll
// Phase 2: Recent products, Favorites, Quick action buttons

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/lib/currency-context';
import { PaymentDetailInput } from '@/types/pos-payment.types';
import { POSSession } from '@/types/pos.types';
import { Category, Customer, Product } from '@prisma/client';
import { ChevronLeft, ChevronRight, Clock, Filter, Heart, Image as ImageIcon, Layers, Minus, Plus, QrCode, Search, ShoppingCart, Trash2, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { POSPaymentPanel } from './pos-payment-panel';
import { PricelistSelector } from './pricelist-selector';

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
    appliedPriceRule?: {
        ruleId: string;
        ruleName: string;
        calculationType: string;
        minQuantity?: number;
        maxQuantity?: number | null;
    } | null;
    priceBeforeDiscount?: number; // Price before pricelist discount
}

interface FilterState {
    searchQuery: string;
    barcodeQuery: string;
    categoryId: string | null;
    inStockOnly: boolean;
    minPrice: number | null;
    maxPrice: number | null;
}

interface Pricelist { // This interface was not closed
    id: string;
    name: string;
    isActive: boolean;
} // Closing brace for Pricelist interface

export function POSClient({ initialSession, products, categories, customers: _customers, cashierId }: POSClientProps) {
    // Session & Cart State
    const [session, setSession] = useState<POSSession | null>(initialSession);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [sessionInitialized, setSessionInitialized] = useState(!!initialSession);
    const [isPaymentPanelOpen, setIsPaymentPanelOpen] = useState(false);

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [sidebarAutoHide, setSidebarAutoHide] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [sidebarView, setSidebarView] = useState<'categories' | 'recent' | 'favorites'>('categories');
    const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Phase 2: Recent & Favorites State
    const [recentProducts, setRecentProducts] = useState<string[]>([]);
    const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);

    // Phase 3: Pricelist State
    const [isCalculatingPrices, setIsCalculatingPrices] = useState(false);
    const [priceCache, setPriceCache] = useState<Record<string, Map<number, any>>>({});
    const [availablePricelists, setAvailablePricelists] = useState<Pricelist[]>([]);
    const [selectedPricelist, setSelectedPricelist] = useState<string | null>(null);
    const [isRecalculatingCart, setIsRecalculatingCart] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        searchQuery: '',
        barcodeQuery: '',
        categoryId: null,
        inStockOnly: false,
        minPrice: null,
        maxPrice: null,
    });

    const { toast } = useToast();
    const { formatCurrency } = useCurrency();

    // Auto-hide sidebar helpers
    const handleAutoHideEnter = () => {
        if (!sidebarAutoHide) return;
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        setSidebarOpen(true);
    };
    const handleAutoHideLeave = () => {
        if (!sidebarAutoHide) return;
        autoHideTimerRef.current = setTimeout(() => setSidebarOpen(false), 300);
    };

    // Calculate price based on pricelist for a product and quantity
    const calculatePrice = async (
        productId: string,
        quantity: number,
        pricelistId: string | null = selectedPricelist
    ): Promise<any> => {
        try {
            const cacheKey = `${pricelistId || 'default'}::${productId}`;

            // Check cache first
            if (priceCache[cacheKey]?.get(quantity)) {
                return priceCache[cacheKey].get(quantity);
            }

            const response = await fetch('/api/pricelists/calculate-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    quantity,
                    pricelistId,
                    customerId: selectedCustomer?.id,
                    categoryId: products.find(p => p.id === productId)?.categoryId,
                }),
            });

            if (!response.ok) {
                console.error('Price calculation failed');
                return { basePrice: 0, calculatedPrice: 0, appliedRule: null };
            }

            const result = await response.json();
            const priceData = result.data;

            // Cache the result
            setPriceCache(prev => {
                const next = { ...prev };
                if (!next[cacheKey]) {
                    next[cacheKey] = new Map();
                }
                next[cacheKey].set(quantity, priceData);
                return next;
            });

            return priceData;
        } catch (error) {
            console.error('Price calculation error:', error);
            return null;
        }
    };

    // Recalculate all cart items with selected pricelist
    const recalculateCartWithPricelist = async (pricelistId: string | null) => {
        setIsRecalculatingCart(true);
        try {
            // Clear price cache to force fresh calculation
            setPriceCache({});

            const updatedCart = await Promise.all(
                cart.map(async (item) => {
                    const priceData = await calculatePrice(item.product.id, item.quantity, pricelistId);
                    return {
                        ...item,
                        unitPrice: (priceData?.calculatedPrice !== undefined && priceData.calculatedPrice !== null)
                            ? priceData.calculatedPrice
                            : item.product.price,
                        appliedPriceRule: priceData?.appliedRule || null,
                        priceBeforeDiscount: priceData?.basePrice || item.product.price,
                    };
                })
            );

            setCart(updatedCart);

            // Show toast feedback
            const pricelistName = pricelistId
                ? availablePricelists.find(p => p.id === pricelistId)?.name
                : 'Default Price';
            toast({
                title: 'Prices Updated',
                description: `Cart prices recalculated with ${pricelistName}`,
            });
        } catch (error) {
            console.error('Error recalculating cart:', error);
            toast({
                title: 'Error',
                description: 'Failed to recalculate prices',
                variant: 'destructive',
            });
        } finally {
            setIsRecalculatingCart(false);
        }
    };

    // Auto-open session
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

    // Load available pricelists
    useEffect(() => {
        const loadPricelists = async () => {
            try {
                const response = await fetch('/api/pricelists');
                if (response.ok) {
                    const result = await response.json();
                    setAvailablePricelists(result.data || []);
                }
            } catch (error) {
                console.error('Error loading pricelists:', error);
            }
        };
        loadPricelists();
    }, []);

    // Handle barcode scanning
    const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filters.barcodeQuery.trim()) {
            const product = products.find(p => p.barcode === filters.barcodeQuery || p.sku === filters.barcodeQuery);
            if (product) {
                handleAddToCart(product);
                setFilters(prev => ({ ...prev, barcodeQuery: '' }));
                // Phase 2: Track recent on barcode scan
                setRecentProducts(prev => {
                    const filtered = prev.filter(id => id !== product.id);
                    return [product.id, ...filtered].slice(0, 10);
                });
                toast({ title: 'Success', description: `Added ${product.name} to cart` });
            } else {
                toast({ title: 'Not Found', description: 'Product barcode not found', variant: 'destructive' });
            }
        }
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(filters.searchQuery.toLowerCase());
        const matchesCategory = !filters.categoryId || p.categoryId === filters.categoryId;
        const matchesStock = !filters.inStockOnly || p.stockQuantity > 0;
        const matchesPrice = (!filters.minPrice || p.price >= filters.minPrice) &&
            (!filters.maxPrice || p.price <= filters.maxPrice);
        return matchesSearch && matchesCategory && matchesStock && matchesPrice;
    });



    // Cart calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discount), 0);
    const totalTax = cart.reduce((sum, item) => {
        const itemTotal = item.unitPrice * item.quantity - item.discount;
        const taxRate = (item.product.taxRate || 0) / 100;
        return sum + (itemTotal * taxRate);
    }, 0);
    const totalAmount = subtotal + totalTax;

    // Session handlers
    const handleOpenSession = async (openingCash: number) => {
        try {
            const response = await fetch('/api/pos/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cashierId, openingCashAmount: openingCash }),
            });
            if (!response.ok) throw new Error('Failed to open session');
            const data = await response.json();
            setSession(data.data);
            toast({ title: 'Success', description: 'Session opened' });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to open session';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
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
            toast({ title: 'Success', description: 'Session closed' });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to close session';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        }
    };

    // Cart handlers with dynamic pricing support
    const handleAddToCart = async (
        product: Product & { category: any, price: number, costPrice: number | null, taxRate: number | null },
        quantity: number = 1
    ) => {
        setIsCalculatingPrices(true);
        try {
            // Try to get price from pricelist, fallback to base price
            const newQty = quantity;
            const priceData = await calculatePrice(product.id, newQty, selectedPricelist);

            // Derive effective unit price from the total calculated price
            let unitPrice = (priceData?.calculatedPrice !== undefined && priceData.calculatedPrice !== null) 
                ? priceData.calculatedPrice 
                : product.price;
            
            const priceData_full = priceData || {};

            const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
            
            if (existingItemIndex > -1) {
                // Update existing item and recalculate prices
                const updatedCart = [...cart];
                const newQuantity = updatedCart[existingItemIndex].quantity + newQty;
                
                // Get new price for updated quantity
                const newPriceData = await calculatePrice(product.id, newQuantity, selectedPricelist);
                const newUnitPrice = (newPriceData?.calculatedPrice !== undefined && newPriceData.calculatedPrice !== null) 
                    ? newPriceData.calculatedPrice 
                    : product.price;

                updatedCart[existingItemIndex] = {
                    ...updatedCart[existingItemIndex],
                    quantity: newQuantity,
                    unitPrice: newUnitPrice,
                    appliedPriceRule: newPriceData?.appliedRule || null,
                    priceBeforeDiscount: newPriceData?.basePrice || product.price,
                };
                setCart(updatedCart);
            } else {
                // Add new item
                setCart([
                    ...cart,
                    {
                        product,
                        quantity: newQty,
                        unitPrice,
                        discount: 0,
                        appliedPriceRule: priceData_full.appliedRule || null,
                        priceBeforeDiscount: priceData_full.basePrice || product.price,
                    },
                ]);
            }

            // Track recent products
            setRecentProducts(prev => {
                const filtered = prev.filter(id => id !== product.id);
                return [product.id, ...filtered].slice(0, 10);
            });

            // Show price rule info if applied
            if (priceData_full.appliedRule) {
                toast({
                    title: 'Price Rule Applied',
                    description: `${priceData_full.appliedRule.ruleName}: ${priceData_full.discountPercentage.toFixed(1)}% off`,
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast({ title: 'Error', description: 'Failed to add item to cart', variant: 'destructive' });
        } finally {
            setIsCalculatingPrices(false);
        }
    };

    const handleUpdateQuantity = async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            handleRemoveFromCart(productId);
            return;
        }

        setIsCalculatingPrices(true);
        try {
            // Get new price for updated quantity
            const priceData = await calculatePrice(productId, quantity, selectedPricelist);
            const newUnitPrice = (priceData?.calculatedPrice !== undefined && priceData.calculatedPrice !== null) 
                ? priceData.calculatedPrice 
                : 0;

            const updatedCart = cart.map(item => {
                if (item.product.id === productId) {
                    return {
                        ...item,
                        quantity,
                        unitPrice: newUnitPrice,
                        appliedPriceRule: priceData?.appliedRule || null,
                        priceBeforeDiscount: priceData?.basePrice || item.product.price,
                    };
                }
                return item;
            });

            setCart(updatedCart);
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            setIsCalculatingPrices(false);
        }
    };

    const handleRemoveFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const handleClearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
    };

    // Handle pricelist selection
    const handleSelectPricelist = async (pricelistId: string | null) => {
        setSelectedPricelist(pricelistId);
        if (cart.length > 0) {
            await recalculateCartWithPricelist(pricelistId);
        }
    };

    // Phase 2: Toggle favorite
    const toggleFavorite = (productId: string) => {
        setFavoriteProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleOpenPaymentPanel = () => {
        if (!session?.id || session.status !== 'OPEN') {
            toast({ title: 'Error', description: 'No active session', variant: 'destructive' });
            return;
        }
        if (cart.length === 0) {
            toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' });
            return;
        }
        setIsPaymentPanelOpen(true);
    };

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

            if (!response.ok) throw new Error('Failed to process transaction');

            toast({ title: 'Success', description: `Transaction ${transactionNumber} completed.` });
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
            {/* Session Header */}
            <div className="flex-shrink-0 bg-white border-b px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {!session || session.status === 'CLOSED' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded">
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
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">Active</span>
                            <Button onClick={() => handleCloseSession(0)} variant="destructive" size="xs" className="h-6">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const next = !sidebarAutoHide;
                            setSidebarAutoHide(next);
                            if (next) setSidebarOpen(false); // hide sidebar immediately
                            else setSidebarOpen(true);       // restore on disable
                        }}
                        title={sidebarAutoHide ? 'Disable sidebar auto-hide' : 'Enable sidebar auto-hide (hover left edge to reveal)'}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                            sidebarAutoHide
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                    >
                        <Layers className="w-3 h-3" />
                        <span className="hidden sm:inline">{sidebarAutoHide ? 'Auto-hide ON' : 'Auto-hide'}</span>
                    </button>
                    <div className="text-xs text-gray-500">
                        {new Date().toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-0 overflow-hidden relative">
                {/* AUTO-HIDE trigger strip — visible when autohide is ON and sidebar is closed */}
                {sidebarAutoHide && !sidebarOpen && (
                    <div
                        className="w-3 flex-shrink-0 bg-slate-200 hover:bg-blue-400 border-r border-slate-300 cursor-e-resize transition-colors z-30"
                        onMouseEnter={handleAutoHideEnter}
                        title="Hover to reveal sidebar"
                    />
                )}

                {/* LEFT SIDEBAR - Categories & Filters */}
                {sidebarOpen && (
                <div
                    className={`${sidebarAutoHide ? 'absolute left-0 top-0 h-full z-40 shadow-2xl' : ''} ${sidebarExpanded ? 'w-64' : 'w-16'} bg-white border-r flex flex-col overflow-hidden transition-all duration-300`}
                    onMouseEnter={sidebarAutoHide ? handleAutoHideEnter : undefined}
                    onMouseLeave={sidebarAutoHide ? handleAutoHideLeave : undefined}
                >
                    {/* Sidebar Header with View Tabs */}
                    <div className="flex-shrink-0 border-b p-3 flex items-center justify-between gap-2">
                        {sidebarExpanded ? (
                            <>
                                <div className="flex gap-1 flex-1">
                                    <Button
                                        onClick={() => setSidebarView('categories')}
                                        variant={sidebarView === 'categories' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs flex-1"
                                        title="Categories"
                                    >
                                        Categories
                                    </Button>
                                    <Button
                                        onClick={() => setSidebarView('recent')}
                                        variant={sidebarView === 'recent' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs flex-1"
                                        title="Recent"
                                    >
                                        <Clock className="w-3 h-3 mr-1" />
                                        Recent
                                    </Button>
                                    <Button
                                        onClick={() => setSidebarView('favorites')}
                                        variant={sidebarView === 'favorites' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs flex-1"
                                        title="Favorites"
                                    >
                                        <Heart className="w-3 h-3 mr-1" />
                                        Fav
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    title="Collapse"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col gap-1 flex-1">
                                    <Button
                                        onClick={() => { setSidebarExpanded(true); setSidebarView('categories'); }}
                                        variant={sidebarView === 'categories' ? 'default' : 'outline'}
                                        size="sm"
                                        className="w-6 h-6 p-0"
                                        title="Categories"
                                    >
                                        📁
                                    </Button>
                                    <Button
                                        onClick={() => { setSidebarExpanded(true); setSidebarView('recent'); }}
                                        variant={sidebarView === 'recent' ? 'default' : 'outline'}
                                        size="sm"
                                        className="w-6 h-6 p-0"
                                        title="Recent"
                                    >
                                        <Clock className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        onClick={() => { setSidebarExpanded(true); setSidebarView('favorites'); }}
                                        variant={sidebarView === 'favorites' ? 'default' : 'outline'}
                                        size="sm"
                                        className="w-6 h-6 p-0"
                                        title="Favorites"
                                    >
                                        <Heart className="w-3 h-3" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    title="Expand"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Barcode Scanner */}
                    <div className="flex-shrink-0 border-b p-3">
                        {sidebarExpanded ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                    <QrCode className="w-3 h-3" /> Barcode/QR
                                </label>
                                <Input
                                    placeholder="Scan barcode..."
                                    value={filters.barcodeQuery}
                                    onChange={(e) => setFilters(prev => ({ ...prev, barcodeQuery: e.target.value }))}
                                    onKeyDown={handleBarcodeSubmit}
                                    className="text-xs"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <QrCode className="w-4 h-4 text-gray-600" title="Barcode Scanner" />
                            </div>
                        )}
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="flex-shrink-0 border-b p-3">
                        {sidebarExpanded ? (
                            <Button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                            >
                                <Filter className="w-3 h-3 mr-1" />
                                Advanced Filters
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                variant="outline"
                                size="sm"
                                className="w-full p-2"
                                title="Advanced Filters"
                            >
                                <Filter className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && sidebarExpanded && (
                        <div className="flex-shrink-0 border-b p-3 space-y-3 bg-gray-50">
                            {/* Stock Filter */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.inStockOnly}
                                    onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
                                    className="w-3 h-3"
                                />
                                <span className="text-xs text-gray-700">In Stock Only</span>
                            </label>

                            {/* Price Range */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Price Range</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : null }))}
                                        className="text-xs w-1/2"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : null }))}
                                        className="text-xs w-1/2"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            <Button
                                onClick={() => setFilters(prev => ({ ...prev, inStockOnly: false, minPrice: null, maxPrice: null }))}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-red-600"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}

                    {/* Phase 2: Quick Action Buttons - Only show when sidebar expanded and not in categories view */}
                    {sidebarExpanded && sidebarView !== 'categories' && (
                        <div className="flex-shrink-0 border-b p-3 space-y-2 bg-blue-50">
                            <h3 className="text-xs font-semibold text-gray-700 mb-2">Quick Actions</h3>
                            <Button
                                onClick={() => {
                                    // Apply a 10% discount to all cart items
                                    setCart(prev => prev.map(item => ({
                                        ...item,
                                        discount: item.unitPrice * item.quantity * 0.1
                                    })));
                                    toast({ title: 'Success', description: '10% discount applied to all items' });
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                disabled={cart.length === 0}
                            >
                                <Zap className="w-3 h-3 mr-1" />
                                Apply 10% Discount
                            </Button>
                            <Button
                                onClick={() => {
                                    // Clear all discounts
                                    setCart(prev => prev.map(item => ({
                                        ...item,
                                        discount: 0
                                    })));
                                    toast({ title: 'Success', description: 'All discounts cleared' });
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                disabled={cart.length === 0}
                            >
                                Clear Discounts
                            </Button>
                            <Button
                                onClick={() => {
                                    // Clear entire cart
                                    handleClearCart();
                                    toast({ title: 'Success', description: 'Cart cleared' });
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs text-red-600 hover:text-red-700"
                                disabled={cart.length === 0}
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Clear Cart
                            </Button>
                        </div>
                    )}

                    {/* Categories/Recent/Favorites List */}
                    <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${sidebarExpanded ? '' : 'flex flex-col items-center'}`}>
                        {sidebarExpanded ? (
                            <>
                                {sidebarView === 'categories' && (
                                    <>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, categoryId: null }))}
                                            className={`w-full text-left text-xs px-3 py-2 rounded transition-colors ${
                                                !filters.categoryId
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            All Products
                                        </button>
                                        {categories.filter(cat => products.some(p => p.categoryId === cat.id)).map(cat => {
                                            const count = products.filter(p => p.categoryId === cat.id).length;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id }))}
                                                    className={`w-full text-left text-xs px-3 py-2 rounded transition-colors ${
                                                        filters.categoryId === cat.id
                                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                    title={cat.name}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{cat.name}</span>
                                                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                            {count}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}

                                {sidebarView === 'recent' && (
                                    <>
                                        {recentProducts.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-4">No recent products</p>
                                        ) : (
                                            recentProducts.map(productId => {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) return null;
                                                return (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => handleAddToCart(product)}
                                                        className="w-full text-left text-xs px-3 py-2 rounded bg-gray-50 hover:bg-blue-100 transition-colors border border-gray-200"
                                                        title={`${product.name} - ${formatCurrency(product.price)}`}
                                                    >
                                                        <div className="flex justify-between items-start gap-1">
                                                            <div>
                                                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                                            </div>
                                                            <span className="text-xs font-bold text-blue-600 flex-shrink-0">
                                                                {formatCurrency(product.price)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </>
                                )}

                                {sidebarView === 'favorites' && (
                                    <>
                                        {favoriteProducts.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-4">No favorite products</p>
                                        ) : (
                                            favoriteProducts.map(productId => {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) return null;
                                                return (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => handleAddToCart(product)}
                                                        className="w-full text-left text-xs px-3 py-2 rounded bg-yellow-50 hover:bg-yellow-100 transition-colors border border-yellow-200"
                                                        title={`${product.name} - ${formatCurrency(product.price)}`}
                                                    >
                                                        <div className="flex justify-between items-start gap-1">
                                                            <div>
                                                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                                            </div>
                                                            <div className="flex gap-1 flex-shrink-0">
                                                                <span className="text-xs font-bold text-blue-600">
                                                                    {formatCurrency(product.price)}
                                                                </span>
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleFavorite(product.id);
                                                                    }}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-red-600"
                                                                >
                                                                    <Heart className="w-3 h-3 fill-current" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full space-y-2 flex flex-col items-center">
                                {sidebarView === 'categories' && (
                                    <>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, categoryId: null }))}
                                            className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                                                !filters.categoryId
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="All Products"
                                        >
                                            📦
                                        </button>
                                        {categories.filter(cat => products.some(p => p.categoryId === cat.id)).map(cat => {
                                            const count = products.filter(p => p.categoryId === cat.id).length;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id }))}
                                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                                                        filters.categoryId === cat.id
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                    title={`${cat.name} (${count})`}
                                                >
                                                    {cat.name.charAt(0).toUpperCase()}
                                                </button>
                                            );
                                        })}
                                    </>
                                )}

                                {sidebarView === 'recent' && (
                                    <>
                                        {recentProducts.length === 0 ? (
                                            <p className="text-xs text-gray-500">No recent</p>
                                        ) : (
                                            recentProducts.slice(0, 6).map(productId => {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) return null;
                                                return (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => handleAddToCart(product)}
                                                        className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-gray-50 hover:bg-blue-100 border border-gray-200 transition-colors"
                                                        title={product.name}
                                                    >
                                                        {product.name.charAt(0).toUpperCase()}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </>
                                )}

                                {sidebarView === 'favorites' && (
                                    <>
                                        {favoriteProducts.length === 0 ? (
                                            <Heart className="w-4 h-4 text-gray-400" title="No favorites" />
                                        ) : (
                                            favoriteProducts.slice(0, 6).map(productId => {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) return null;
                                                return (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => handleAddToCart(product)}
                                                        className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors"
                                                        title={product.name}
                                                    >
                                                        <Heart className="w-3 h-3 text-red-500 fill-current" />
                                                    </button>
                                                );
                                            })
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* Sidebar Toggle Button (when closed, non-autohide mode) */}
                {!sidebarOpen && !sidebarAutoHide && (
                    <Button
                        onClick={() => setSidebarOpen(true)}
                        variant="ghost"
                        size="sm"
                        className="w-12 h-12 border-r flex-shrink-0"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )}

                {/* MAIN PRODUCT AREA */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {/* Search Bar */}
                    <div className="flex-shrink-0 border-b p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={filters.searchQuery}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Product Count Display */}
                    <div className="flex-shrink-0 border-b px-4 py-2 flex items-center justify-between text-xs text-gray-600">
                        <span>
                            Showing {filteredProducts.length} products
                        </span>
                    </div>

                    {/* Product Grid - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                        isFavorite={favoriteProducts.includes(product.id)}
                                        onToggleFavorite={toggleFavorite}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 text-sm">No products found</p>
                            </div>
                        )}
                    </div>


                </div>

                {/* RIGHT SIDEBAR - CART */}
                <div className="w-80 bg-white border-l flex flex-col overflow-hidden flex-shrink-0">
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

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-8">Cart is empty</p>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <CartItemRow
                                        key={item.product.id}
                                        item={item}
                                        onRemove={handleRemoveFromCart}
                                        onUpdateQuantity={handleUpdateQuantity}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Summary & Actions */}
                    <div className="flex-shrink-0 border-t p-3 space-y-2 bg-gray-50">
                        {/* Pricelist Selector */}
                        <PricelistSelector
                            pricelists={availablePricelists}
                            selectedPricelistId={selectedPricelist}
                            onSelectPricelist={handleSelectPricelist}
                            disabled={isRecalculatingCart || cart.length === 0}
                        />

                        <div className="space-y-1 text-xs mt-3 pt-3 border-t">
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

                        <div className="space-y-2 pt-2 mt-3 border-t">
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
                                    disabled={isProcessingPayment || cart.length === 0 || isRecalculatingCart}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessingPayment ? 'Processing...' : isRecalculatingCart ? 'Updating Prices...' : `Pay (${formatCurrency(totalAmount)})`}
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
    isFavorite?: boolean;
    onToggleFavorite?: (productId: string) => void;
}

function ProductCard({ product, onAddToCart, isFavorite = false, onToggleFavorite }: ProductCardProps) {
    return (
        <div
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
            onClick={() => onAddToCart(product)}
        >
            {/* Favorite Button */}
            {onToggleFavorite && (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(product.id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-white/80 hover:bg-white shadow-sm"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
            )}

            <div className="relative bg-gray-100 h-32 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                ) : (
                    <div className="flex items-center justify-center text-gray-400">
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
    const hasDiscount = item.priceBeforeDiscount && item.unitPrice < item.priceBeforeDiscount;
    
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
                    <div className="flex items-center gap-1">
                        {hasDiscount ? (
                            <>
                                <span className="text-xs text-gray-400 line-through">
                                    {formatCurrency(item.priceBeforeDiscount!)}
                                </span>
                                <span className="text-xs text-green-600 font-medium">
                                    {formatCurrency(item.unitPrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-xs text-gray-500">
                                {formatCurrency(item.unitPrice)} each
                            </span>
                        )}
                    </div>
                    {item.appliedPriceRule && (
                        <p
                            className="text-[11px] text-blue-600 mt-0.5"
                            title={`Qty ${item.appliedPriceRule.minQuantity ?? 1}${item.appliedPriceRule.maxQuantity ? ` - ${item.appliedPriceRule.maxQuantity}` : '+'} • ${item.appliedPriceRule.calculationType.replace(/_/g, ' ')}`}
                        >
                            🏷️ {item.appliedPriceRule.ruleName}
                            {item.appliedPriceRule.minQuantity && (
                                <span className="text-[10px] text-blue-500 ml-1">
                                    (≥{item.appliedPriceRule.minQuantity}
                                    {item.appliedPriceRule.maxQuantity ? ` ≤${item.appliedPriceRule.maxQuantity}` : '+'})
                                </span>
                            )}
                        </p>
                    )}
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
