'use client';

import { Small } from '@/components/ui';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useProductsAndCategories } from '@/hooks/usePricelistSelectors';
import { BorderRadius, Colors, Spacing } from '@/lib/design-tokens';
import {
    pricelistFormSchema,
    type PricelistFormData,
} from '@/lib/validations/pricelist.schema';
import { formatCurrency, getCurrencyCode, getCurrencySymbol } from '@/lib/currency';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

interface PricelistFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function PricelistForm({ initialData, isEdit = false }: PricelistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [activeProductTab, setActiveProductTab] = useState<string | null>(null);

  // Fetch products
  const { products, isLoading: isLoadingSelectors, error: selectorsError } = useProductsAndCategories();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<PricelistFormData>({
    resolver: zodResolver(pricelistFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 0,
      isActive: initialData?.isActive !== false,
      rules: initialData?.rules || [],
    },
  });

  const { fields: ruleFields, append: appendRule, remove: removeRule, update: updateRule } = useFieldArray({
    control,
    name: 'rules',
  });

  // Get unique product IDs from rules (grouped by product)
  const productsInRules = useMemo(() => {
    const uniqueProducts = Array.from(new Set(ruleFields.map(r => r.productId).filter(Boolean)));
    return uniqueProducts;
  }, [ruleFields]);

  // Get rules for a specific product
  const getRulesForProduct = (productId: string) => {
    return ruleFields
      .map((field, idx) => ({ index: idx, ...field }))
      .filter(rule => rule.productId === productId);
  };

  // Get product details
  const getProductName = (productId: string) => {
    return products?.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  // Friendly currency formatter for quick previews
  const prettyMoney = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
    return formatCurrency(amount);
  };

  const getBasePrice = (productId: string) =>
    products?.find(p => p.id === productId)?.price ?? null;

  const getEffectiveUnitPreview = (rule: any, productId: string) => {
    const basePrice = getBasePrice(productId);
    if (basePrice === null) return '—';
    switch (rule.calculationType) {
      case 'PERCENTAGE_DISCOUNT':
        return prettyMoney(basePrice * (1 - (Number(rule.discountPercentage || 0) / 100)));
      case 'FIXED_PRICE':
        // fixedPrice is total for the bundle; show per-unit effective
        return rule.fixedPrice
          ? prettyMoney(Number(rule.fixedPrice) / (rule.minQuantity || 1))
          : '—';
      case 'FIXED_DISCOUNT':
        return prettyMoney(Math.max(0, basePrice - Number(rule.fixedDiscount || 0)));
      case 'FORMULA':
        const margin = Number(rule.formulaMargin || 0);
        const markup = Number(rule.formulaMarkup || 0);
        return prettyMoney((basePrice + margin) * (1 + markup / 100));
      default:
        return prettyMoney(basePrice);
    }
  };

  /**
   * Get total price preview for a rule (useful for FIXED_PRICE to show customer what they'll pay)
   */
  const getTotalPricePreview = (rule: any, quantity: number) => {
    if (rule.calculationType !== 'FIXED_PRICE') return null;
    if (!rule.fixedPrice || !rule.minQuantity) return null;
    
    const tierPrice = Number(rule.fixedPrice);
    const tierQty = Number(rule.minQuantity);
    const total = tierPrice * (quantity / tierQty);
    return prettyMoney(total);
  };

  const selectedProductProduct = activeProductTab ? products?.find(p => p.id === activeProductTab) : null;
  const rulesForSelectedProduct = activeProductTab ? getRulesForProduct(activeProductTab) : [];

  const onSubmit = async (data: PricelistFormData) => {
    setIsLoading(true);

    try {
      console.log('Form submitted - Data:', JSON.stringify(data, null, 2));
      
      // Only include rules with valid product IDs (filter out incomplete rules)
      const validRules = (data.rules || []).filter(rule => {
        const hasProductId = rule.productId && typeof rule.productId === 'string' && rule.productId.match(/^[0-9a-f-]{36}$/i);
        return hasProductId;
      });
      
      console.log('Valid rules count:', validRules.length);
      console.log('Valid rules:', JSON.stringify(validRules, null, 2));

      // Validate that we have at least one rule
      if (validRules.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one product with pricing tiers and ensure calculations are set',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Validate each rule has proper quantities and calculation values
      for (let i = 0; i < validRules.length; i++) {
        const rule = validRules[i];

        // Check quantity range
        if (!rule.minQuantity || rule.minQuantity < 1) {
          toast({
            title: 'Error',
            description: `Tier ${i + 1}: Min quantity must be at least 1`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        if (rule.maxQuantity && rule.maxQuantity < rule.minQuantity) {
          toast({
            title: 'Error',
            description: `Tier ${i + 1}: Max quantity must be >= min quantity`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Check calculation type has required values
        if (rule.calculationType === 'PERCENTAGE_DISCOUNT') {
          if (rule.discountPercentage === null || rule.discountPercentage === undefined || rule.discountPercentage === '') {
            toast({
              title: 'Error',
              description: `Tier ${i + 1}: Discount % is required`,
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        } else if (rule.calculationType === 'FIXED_PRICE') {
          if (rule.fixedPrice === null || rule.fixedPrice === undefined || rule.fixedPrice === '') {
            toast({
              title: 'Error',
              description: `Tier ${i + 1}: Fixed Price is required`,
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        } else if (rule.calculationType === 'FIXED_DISCOUNT') {
          if (rule.fixedDiscount === null || rule.fixedDiscount === undefined || rule.fixedDiscount === '') {
            toast({
              title: 'Error',
              description: `Tier ${i + 1}: Fixed Discount is required`,
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        } else if (rule.calculationType === 'FORMULA') {
          const hasMargin = rule.formulaMargin !== null && rule.formulaMargin !== undefined && rule.formulaMargin !== '';
          const hasMarkup = rule.formulaMarkup !== null && rule.formulaMarkup !== undefined && rule.formulaMarkup !== '';
          if (!hasMargin && !hasMarkup) {
            toast({
              title: 'Error',
              description: `Tier ${i + 1}: Margin or Markup is required for Formula type`,
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        }
      }

      const payload = {
        ...data,
        rules: validRules.map((rule) => ({
          ...rule,
          id: rule.id && !rule.id.startsWith('rule-') ? rule.id : undefined,
        })),
      };

      console.log('Submitting pricelist:', JSON.stringify(payload, null, 2));

      const url = isEdit ? `/api/pricelists/${initialData?.id}` : '/api/pricelists';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('API Response:', { status: response.status, body: result });

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to ${isEdit ? 'update' : 'create'} pricelist`
        );
      }

      toast({
        title: 'Success',
        description: `Pricelist ${isEdit ? 'updated' : 'created'} successfully`,
      });

      router.push('/dashboard/pricelists');
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save pricelist';
      console.error('Pricelist submission error:', error);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (newProductId: string) => {
    if (!newProductId) return;

    // Set as active tab
    setActiveProductTab(newProductId);
    setEditingTierIndex(null);

    // Add a first tier for this product
    appendRule({
      productId: newProductId,
      name: 'Tier 1',
      minQuantity: 1,
      maxQuantity: null,
      calculationType: 'PERCENTAGE_DISCOUNT',
      discountPercentage: 0,
      fixedPrice: null,
      fixedDiscount: null,
      formulaMargin: null,
      formulaMarkup: null,
      isActive: true,
      id: `rule-${Date.now()}-${Math.random()}`,
    });

    toast({
      title: 'Success',
      description: `Product added. Click "Add Quantity Tier" to add pricing tiers.`,
    });
  };

  const handleInvalidSubmit = (invalidFields: any) => {
    // Log detailed errors for debugging
    console.error('Form has invalid fields:', invalidFields);
    
    // Extract and show specific errors
    const errorMessages: string[] = [];
    
    if (invalidFields.name) {
      errorMessages.push('Pricelist name is required');
    }
    
    if (invalidFields.rules) {
      const ruleErrors = invalidFields.rules as any[];
      ruleErrors.forEach((error, idx) => {
        if (error?.productId) {
          errorMessages.push(`Tier ${idx + 1}: Product selection is invalid`);
        }
        if (error?.maxQuantity) {
          errorMessages.push(`Tier ${idx + 1}: Max quantity must be valid`);
        }
      });
    }
    
    toast({
      title: 'Validation Error',
      description: errorMessages.length > 0 ? errorMessages.join(', ') : 'Please check all required fields',
      variant: 'destructive',
    });
  };

  const handleAddProductTier = () => {
    if (!activeProductTab) {
      toast({
        title: 'Error',
        description: 'Please select a product first',
        variant: 'destructive',
      });
      return;
    }

    // Get the last tier's max quantity for smart tier calculation
    const lastTier = rulesForSelectedProduct[rulesForSelectedProduct.length - 1];
    const lastMaxQty = lastTier ? lastTier.maxQuantity : null;

    appendRule({
      productId: activeProductTab,
      name: `Tier ${rulesForSelectedProduct.length + 1}`,
      minQuantity: rulesForSelectedProduct.length > 0 
        ? (lastMaxQty || 100) + 1 
        : 1,
      maxQuantity: null,
      calculationType: 'PERCENTAGE_DISCOUNT',
      discountPercentage: 0,
      fixedPrice: null,
      fixedDiscount: null,
      formulaMargin: null,
      formulaMarkup: null,
      isActive: true,
      id: `rule-${Date.now()}-${Math.random()}`,
    });

    // Auto-open new tier in edit mode (new item sits at current ruleFields length)
    setEditingTierIndex(ruleFields.length);
  };

  const handleDeleteTier = (index: number) => {
    removeRule(index);
    if (ruleFields.length <= 1) {
      setEditingTierIndex(null);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    // Remove all rules for this product
    const indicesToRemove = ruleFields
      .map((field, idx) => field.productId === productId ? idx : -1)
      .filter(idx => idx !== -1)
      .reverse(); // Remove from end to avoid index shifting

    indicesToRemove.forEach(idx => removeRule(idx));

    // Switch to another product or clear
    if (activeProductTab === productId) {
      const remainingProducts = productsInRules.filter(p => p !== productId);
      setActiveProductTab(remainingProducts[0] || null);
    }

    toast({
      title: 'Success',
      description: 'Product and its tiers removed',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card style={{ padding: Spacing.lg }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: Colors.text.primary, marginBottom: Spacing.lg }}>
          Pricelist Information
        </p>
        <Small style={{ color: Colors.text.secondary, marginBottom: Spacing.lg, display: 'block' }}>
          💵 Currency: All prices are in {getCurrencyCode()} (Global Setting)
        </Small>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Small style={{ display: 'block', color: Colors.text.primary, fontWeight: '500', marginBottom: `${Spacing.xs}` }}>
              Pricelist Name *
            </Small>
            <Input
              {...register('name')}
              placeholder="e.g., Wholesale, VIP, Summer Sale"
              style={{ borderColor: errors.name ? Colors.danger : undefined }}
            />
            {errors.name && (
              <Small style={{ color: Colors.danger, display: 'block', marginTop: Spacing.xs }}>
                {errors.name.message}
              </Small>
            )}
          </div>

          {/* Description */}
          <div>
            <Small style={{ display: 'block', color: Colors.text.primary, fontWeight: '500', marginBottom: Spacing.xs }}>
              Description
            </Small>
            <Input
              {...register('description')}
              placeholder="Optional description"
              style={{ borderColor: errors.description ? Colors.danger : undefined }}
            />
            {errors.description && (
              <Small style={{ color: Colors.danger, display: 'block', marginTop: Spacing.xs }}>
                {errors.description.message}
              </Small>
            )}
          </div>

          {/* Priority */}
          <div>
            <Small style={{ display: 'block', color: Colors.text.primary, fontWeight: '500', marginBottom: Spacing.xs }}>
              Priority
            </Small>
            <Input
              {...register('priority', { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              style={{ borderColor: errors.priority ? Colors.danger : undefined }}
            />
            <Small color={Colors.text.secondary} className="mt-1 block">Higher = applied first</Small>
            {errors.priority && (
              <Small style={{ color: Colors.danger, display: 'block', marginTop: Spacing.xs }}>
                {errors.priority.message}
              </Small>
            )}
          </div>

          {/* Active Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, cursor: 'pointer' }}>
            <input
              {...register('isActive')}
              type="checkbox"
              style={{ width: '16px', height: '16px' }}
            />
            <Small color={Colors.text.primary}>Active</Small>
          </label>
        </div>
      </Card>

      {/* Product Pricing Tiers */}
      <Card style={{ padding: Spacing.lg }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: Colors.text.primary, marginBottom: Spacing.lg }}>
          📦 Product Pricing Tiers
        </p>
        <Small style={{ color: Colors.text.secondary, marginBottom: Spacing.lg, display: 'block' }}>
          Add multiple products and define quantity-based pricing tiers for each
        </Small>

        {/* Show rules validation errors if any */}
        {errors.rules && (
          <div style={{ padding: Spacing.md, backgroundColor: Colors.danger, borderRadius: BorderRadius.md, marginBottom: Spacing.lg }}>
            <Small style={{ color: Colors.white, fontWeight: '500' }}>
              ⚠️ Pricing Tier Error: {typeof errors.rules.message === 'string' ? errors.rules.message : 'Please check all tiers have required values'}
            </Small>
          </div>
        )}

        {/* Add Product Section */}
        <div style={{ marginBottom: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md }}>
          <Small style={{ display: 'block', color: Colors.text.primary, fontWeight: '500', marginBottom: Spacing.md }}>
            Add Products to Pricelist
          </Small>
          {isLoadingSelectors ? (
            <Small color={Colors.text.secondary}>⏳ Loading products...</Small>
          ) : selectorsError ? (
            <Small style={{ color: Colors.danger }}>⚠️ Error loading products: {selectorsError}</Small>
          ) : products && products.length > 0 ? (
            <Controller
              name="rules.0.productId"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', gap: Spacing.md, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Autocomplete
                      options={products
                        .filter(p => !productsInRules.includes(p.id)) // Don't show already added products
                        .map((product) => ({
                          id: product.id,
                          value: product.id,
                          label: product.name,
                          searchText: `${product.name}${product.sku ? ` (${product.sku})` : ''} ${product.price ? `- ${formatCurrency(product.price)}` : ''}`,
                        }))}
                      value={''}
                      onChange={(val) => {
                        field.onChange(val);
                        if (val) {
                          handleAddProduct(val);
                          field.onChange(''); // Reset the field
                        }
                      }}
                      placeholder="Search and select a product..."
                      searchPlaceholder="Type product name or SKU..."
                      displayValue={() => 'Select a product...'}
                      isLoading={isLoadingSelectors}
                      closeOnSelect={true}
                    />
                  </div>
                </div>
              )}
            />
          ) : (
            <Small style={{ color: Colors.danger }}>
              ❌ No products available. Create products first in Inventory.
            </Small>
          )}
        </div>

        {/* Product Tabs */}
        {productsInRules.length > 0 && (
          <div style={{ marginBottom: Spacing.lg }}>
            <div style={{ 
              display: 'flex', 
              gap: Spacing.sm, 
              flexWrap: 'wrap',
              borderBottom: `2px solid ${Colors.gray[200]}`,
              paddingBottom: Spacing.md,
              marginBottom: Spacing.lg 
            }}>
              {productsInRules.map((productId) => {
                const productObj = products?.find(p => p.id === productId);
                const isActive = activeProductTab === productId;
                return (
                  <div
                    key={productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: Spacing.xs,
                      padding: `${Spacing.sm} ${Spacing.md}`,
                      backgroundColor: isActive ? Colors.primary : Colors.gray[100],
                      color: isActive ? Colors.white : Colors.text.primary,
                      borderRadius: BorderRadius.md,
                      cursor: 'pointer',
                      fontWeight: isActive ? '600' : '500',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProductTab(productId);
                        setEditingTierIndex(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        flex: 1,
                        textAlign: 'left',
                        padding: 0,
                        fontFamily: 'inherit',
                        fontWeight: 'inherit',
                        fontSize: '14px',
                      }}
                    >
                      {productObj?.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProduct(productId);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        lineHeight: 1,
                      }}
                      title="Remove product"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Active Product's Tiers */}
            {activeProductTab && selectedProductProduct && (
              <div>
                <Small style={{ display: 'block', color: Colors.text.primary, fontWeight: '600', marginBottom: Spacing.md }}>
                  💰 {selectedProductProduct.name} (SKU: {selectedProductProduct.sku || 'N/A'}) - Cost: {selectedProductProduct.costPrice ? formatCurrency(selectedProductProduct.costPrice) : 'N/A'} | Price: {selectedProductProduct.price ? formatCurrency(selectedProductProduct.price) : 'N/A'}
                </Small>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddProductTier()}
                  >
                    + Add Tier
                  </Button>
                </div>

                {rulesForSelectedProduct.length > 0 ? (
                  <div style={{ overflowX: 'auto', marginBottom: Spacing.lg, border: `1px solid ${Colors.gray[200]}`, borderRadius: BorderRadius.md }}>
                    <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: Colors.gray[50], borderBottom: `1px solid ${Colors.gray[200]}` }}>
                          <th style={{ padding: Spacing.md, textAlign: 'center', fontWeight: '600', color: Colors.text.primary, minWidth: '70px', whiteSpace: 'nowrap' }}>Min Qty</th>
                          <th style={{ padding: Spacing.md, textAlign: 'center', fontWeight: '600', color: Colors.text.primary, minWidth: '70px', whiteSpace: 'nowrap' }}>Max Qty</th>
                          <th style={{ padding: Spacing.md, textAlign: 'center', fontWeight: '600', color: Colors.text.primary, minWidth: '90px', whiteSpace: 'nowrap' }}>Type</th>
                          <th style={{ padding: Spacing.md, textAlign: 'center', fontWeight: '600', color: Colors.text.primary, minWidth: '100px' }}>Value</th>
                          <th style={{ padding: Spacing.md, textAlign: 'center', fontWeight: '600', color: Colors.text.primary, minWidth: '110px', whiteSpace: 'nowrap' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rulesForSelectedProduct.map((tierItem) => {
                          const ruleIndex = tierItem.index;
                          const tier = ruleFields[ruleIndex];
                          const watchedTier = watch(`rules.${ruleIndex}`);
                          const displayTier = watchedTier ?? tier;
                          const isEditing = editingTierIndex === ruleIndex;

                          return (
                            <tr
                              key={`tier-${ruleIndex}`}
                              style={{
                                borderBottom: `1px solid ${Colors.gray[200]}`,
                                backgroundColor: isEditing ? Colors.gray[50] : Colors.white,
                              }}
                            >
                              {isEditing ? (
                                <>
                                  {/* Edit Mode */}
                                  <td style={{ padding: Spacing.md, minWidth: '70px' }}>
                                    <Input
                                      {...register(`rules.${ruleIndex}.minQuantity`, { valueAsNumber: true })}
                                      type="number"
                                      min="1"
                                      style={{ width: '100%' }}
                                    />
                                  </td>
                                  <td style={{ padding: Spacing.md, minWidth: '70px' }}>
                                    <Input
                                      {...register(`rules.${ruleIndex}.maxQuantity`, { valueAsNumber: true })}
                                      type="number"
                                      min="1"
                                      placeholder="∞"
                                      style={{ width: '100%' }}
                                    />
                                  </td>
                                  <td style={{ padding: Spacing.md, minWidth: '90px' }}>
                                    <select
                                      {...register(`rules.${ruleIndex}.calculationType`)}
                                      style={{
                                        width: '100%',
                                        padding: `${Spacing.sm} ${Spacing.md}`,
                                        border: `1px solid ${Colors.gray[200]}`,
                                        borderRadius: BorderRadius.md,
                                        fontSize: '14px',
                                        color: Colors.text.primary,
                                        backgroundColor: Colors.white,
                                        fontFamily: 'inherit',
                                      }}
                                    >
                                      <option value="PERCENTAGE_DISCOUNT">Discount %</option>
                                      <option value="FIXED_PRICE">Fixed Price</option>
                                      <option value="FIXED_DISCOUNT">Fixed Discount</option>
                                      <option value="FORMULA">Formula</option>
                                    </select>
                                  </td>
                                  <td style={{ padding: Spacing.md, minWidth: '100px' }}>
                                    {watch(`rules.${ruleIndex}.calculationType`) === 'PERCENTAGE_DISCOUNT' && (
                                      <Input
                                        {...register(`rules.${ruleIndex}.discountPercentage`, { valueAsNumber: true })}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="%"
                                        style={{ width: '100%' }}
                                      />
                                    )}
                                    {watch(`rules.${ruleIndex}.calculationType`) === 'FIXED_PRICE' && (
                                      <div style={{ width: '100%' }}>
                                        <Input
                                          {...register(`rules.${ruleIndex}.fixedPrice`, { valueAsNumber: true })}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="Total for tier"
                                          title="Total price for the quantity tier (e.g., 25 for 3 units means 8.33 per unit)"
                                          style={{ width: '100%' }}
                                        />
                                        <Small color={Colors.text.secondary} style={{ marginTop: Spacing.xs, display: 'block', fontSize: '12px' }}>
                                          Total for qty {watch(`rules.${ruleIndex}.minQuantity`) || 1}
                                        </Small>
                                      </div>
                                    )}
                                    {watch(`rules.${ruleIndex}.calculationType`) === 'FIXED_DISCOUNT' && (
                                      <Input
                                        {...register(`rules.${ruleIndex}.fixedDiscount`, { valueAsNumber: true })}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Amount"
                                        style={{ width: '100%' }}
                                      />
                                    )}
                                    {watch(`rules.${ruleIndex}.calculationType`) === 'FORMULA' && (
                                      <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap' }}>
                                        <Input
                                          {...register(`rules.${ruleIndex}.formulaMargin`, { valueAsNumber: true })}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="Margin"
                                          style={{ width: '48%' }}
                                        />
                                        <Input
                                          {...register(`rules.${ruleIndex}.formulaMarkup`, { valueAsNumber: true })}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="Markup %"
                                          style={{ width: '48%' }}
                                        />
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: Spacing.md, textAlign: 'center', minWidth: '200px' }}>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                      <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={() => setEditingTierIndex(null)}
                                        className="p-2 h-8 w-8"
                                        aria-label="Save tier"
                                        style={{
                                          backgroundColor: Colors.success,
                                          color: Colors.white,
                                          borderColor: Colors.success,
                                        }}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteTier(ruleIndex)}
                                        className="p-2 h-8 w-8"
                                        aria-label="Delete tier"
                                        style={{
                                          backgroundColor: Colors.danger,
                                          color: Colors.white,
                                          borderColor: Colors.danger,
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* View Mode */}
                                  <td style={{ padding: Spacing.md, color: Colors.text.primary, textAlign: 'center', minWidth: '70px' }}>
                                    {displayTier.minQuantity}
                                  </td>
                                  <td style={{ padding: Spacing.md, color: Colors.text.primary, textAlign: 'center', minWidth: '70px' }}>
                                    {displayTier.maxQuantity || '∞'}
                                  </td>
                                  <td style={{ padding: Spacing.md, color: Colors.text.primary, textAlign: 'center', minWidth: '90px', whiteSpace: 'nowrap' }}>
                                    {displayTier.calculationType === 'PERCENTAGE_DISCOUNT' && 'Discount %'}
                                    {displayTier.calculationType === 'FIXED_PRICE' && 'Fixed Price'}
                                    {displayTier.calculationType === 'FIXED_DISCOUNT' && 'Fixed Discount'}
                                    {displayTier.calculationType === 'FORMULA' && 'Formula'}
                                  </td>
                                  <td style={{ padding: Spacing.md, color: Colors.text.primary, fontWeight: '500', minWidth: '100px', textAlign: 'center' }}>
                                    {displayTier.calculationType === 'PERCENTAGE_DISCOUNT' && `${displayTier.discountPercentage}%`}
                                    {displayTier.calculationType === 'FIXED_PRICE' && `${getCurrencySymbol()}${displayTier.fixedPrice}`}
                                    {displayTier.calculationType === 'FIXED_DISCOUNT' && `${getCurrencySymbol()}${displayTier.fixedDiscount}`}
                                    {displayTier.calculationType === 'FORMULA' && `M:${displayTier.formulaMargin} U:${displayTier.formulaMarkup}%`}
                                    <div className="text-[11px] text-gray-500 mt-1">
                                      Est. unit: {getEffectiveUnitPreview(displayTier, selectedProductProduct.id)}
                                    </div>
                                  </td>
                                  <td style={{ padding: Spacing.md, textAlign: 'center', minWidth: '200px' }}>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingTierIndex(ruleIndex)}
                                        className="p-2 h-8 w-8"
                                        aria-label="Edit tier"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteTier(ruleIndex)}
                                        className="p-2 h-8 w-8"
                                        aria-label="Delete tier"
                                        style={{
                                          backgroundColor: Colors.danger,
                                          color: Colors.white,
                                          borderColor: Colors.danger,
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Small style={{ color: Colors.text.secondary, padding: `${Spacing.md}`, backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md, textAlign: 'center', display: 'block' }}>
                    No quantity tiers defined yet. Click "Add Tier" to create one.
                  </Small>
                )}

                {/* Add Tier Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={handleAddProductTier}
                  style={{ width: '100%' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Quantity Tier
                </Button>
              </div>
            )}
          </div>
        )}

        {productsInRules.length === 0 && (
          <Small style={{ color: Colors.text.secondary, padding: `${Spacing.md}`, backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md, textAlign: 'center', display: 'block' }}>
            👆 Select products above to start adding quantity-based pricing tiers
          </Small>
        )}
      </Card>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: Spacing.md }}>
        <Button
          type="submit"
          disabled={isLoading || isSubmitting}
        >
          {isEdit ? 'Update Pricelist' : 'Create Pricelist'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/pricelists')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
