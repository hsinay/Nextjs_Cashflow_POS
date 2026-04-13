import { prisma } from '@/lib/prisma';

interface PriceCalculationInput {
  productId: string;
  quantity: number;
  pricelistId?: string | null;
  customerId?: string | null;
  categoryId?: string | null;
}

interface PriceCalculationResult {
  basePrice: number; // Base unit price
  calculatedPrice: number; // Effective unit price after rule (quantity-aware)
  calculatedTotal: number; // Total price for the requested quantity
  discount: number; // Absolute discount per unit
  discountPercentage: number; // Discount percentage per unit
  appliedRule: {
    ruleId: string;
    ruleName: string;
    calculationType: string;
    minQuantity?: number;
    maxQuantity?: number | null;
  } | null;
}

/**
 * Calculate the final price for a product based on active pricelists and rules.
 * - Supports optional pricelistId (explicit selection).
 * - Respects pricelist applicability (customer, category, date range).
 * - Evaluates rules in priority order, then quantity match.
 * - Returns totals for the requested quantity (not per-unit).
 */
export async function calculateProductPrice(
  input: PriceCalculationInput
): Promise<PriceCalculationResult> {
  const { productId, quantity, pricelistId, customerId, categoryId } = input;

  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const baseUnitPrice = Number(product.price);
  const productCategoryId = categoryId || product.categoryId || null;
  const now = new Date();

  // Build pricelist filter
  const pricelistWhere: any = {
    isActive: true,
    ...(pricelistId ? { id: pricelistId } : {}),
    AND: [
      {
        OR: [{ startDate: null }, { startDate: { lte: now } }],
      },
      {
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    ],
  };

  // Fetch candidate pricelists
  const pricelists = await prisma.pricelist.findMany({
    where: pricelistWhere,
    include: {
      rules: {
        where: { isActive: true },
        orderBy: [
          { priority: 'desc' },
          { minQuantity: 'desc' },
        ],
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Evaluate each pricelist by priority
  for (const pricelist of pricelists) {
    // Pricelist applicability checks (customer/category/date already filtered by query)
    const customerMatches =
      !pricelist.applicableToCustomer ||
      (customerId && pricelist.applicableToCustomer === customerId);
    const categoryMatches =
      !pricelist.applicableToCategory ||
      (productCategoryId &&
        pricelist.applicableToCategory === productCategoryId);

    if (!customerMatches || !categoryMatches) continue;

    // Find first rule that matches quantity and target
    for (const rule of pricelist.rules) {
      const quantityMatches =
        quantity >= rule.minQuantity &&
        (!rule.maxQuantity || quantity <= rule.maxQuantity);

      if (!quantityMatches) continue;

      const targetMatches =
        rule.appliedTo === 'ALL_PRODUCTS' ||
        (rule.appliedTo === 'PRODUCT' &&
          rule.productId === productId) ||
        (rule.appliedTo === 'CATEGORY' &&
          rule.categoryId &&
          rule.categoryId === productCategoryId) ||
        rule.appliedTo === 'CUSTOMER';

      if (!targetMatches) continue;

      // Calculate price based on rule type (returns total for qty)
      const calculatedTotal = applySingleRule(
        baseUnitPrice,
        rule,
        quantity,
        product
      );

      const calculatedUnit = quantity > 0 ? calculatedTotal / quantity : baseUnitPrice;

      return {
        basePrice: baseUnitPrice,
        calculatedPrice: calculatedUnit,
        calculatedTotal: calculatedTotal,
        discount: baseUnitPrice - calculatedUnit,
        discountPercentage:
          baseUnitPrice === 0
            ? 0
            : ((baseUnitPrice - calculatedUnit) / baseUnitPrice) * 100,
        appliedRule: {
          ruleId: rule.id,
          ruleName: rule.name,
          calculationType: rule.calculationType,
          minQuantity: rule.minQuantity,
          maxQuantity: rule.maxQuantity,
        },
      };
    }
  }

  // No matching rule found, return base price totals
  return {
    basePrice: baseUnitPrice,
    calculatedPrice: baseUnitPrice,
    calculatedTotal: baseUnitPrice * quantity,
    discount: 0,
    discountPercentage: 0,
    appliedRule: null,
  };
}

/**
 * Apply a single rule to calculate the price for given quantity
 * 
 * For FIXED_PRICE rules:
 * - fixedPrice represents the total cost for minQuantity units
 * - Uses Bundle + Remainder logic when ordering qty > minQuantity:
 *   * Complete bundles get the tier price
 *   * Remainder units get the base product price
 * 
 * Example: If rule is "3 units @ 25" with base price 10:
 * - 3 units: 1 bundle × 25 = 25 total (8.33 per-unit)
 * - 5 units: 1 bundle × 25 + 2 remainder × 10 = 45 total (9.00 per-unit)
 * - 6 units: 2 bundles × 25 = 50 total (8.33 per-unit)
 */
function applySingleRule(
  baseUnitPrice: number,
  rule: any,
  quantity: number,
  product: any
): number {
  const baseTotal = baseUnitPrice * quantity;
  let calculatedPrice = baseTotal;

  switch (rule.calculationType) {
    case 'FIXED_PRICE': {
      const tierPrice = Number(rule.fixedPrice ?? baseUnitPrice);
      const tierQuantity = Number(rule.minQuantity ?? 1);

      if (tierQuantity > 0) {
        // Bundle + Remainder Logic:
        // tierPrice is the total cost for tierQuantity units
        // Example: If tier is "3 units @ 25", then:
        //   - 3 units = 25 (tier price)
        //   - 5 units = 1 bundle (3 @ 25) + 2 remainder (@ base price 10 each) = 45
        const bundles = Math.floor(quantity / tierQuantity);
        const remainder = quantity % tierQuantity;
        calculatedPrice = bundles * tierPrice + remainder * baseUnitPrice;
      } else {
        // Treat fixed price as per-unit fallback
        calculatedPrice = tierPrice * quantity;
      }
      break;
    }

    case 'PERCENTAGE_DISCOUNT': {
      const discountPercent = Number(rule.discountPercentage || 0);
      calculatedPrice = baseTotal * (1 - discountPercent / 100);
      break;
    }

    case 'FIXED_DISCOUNT': {
      const fixedDiscount = Number(rule.fixedDiscount || 0);
      // Fixed discount is applied per unit to keep parity with Odoo behavior
      calculatedPrice = Math.max(0, baseTotal - fixedDiscount * quantity);
      break;
    }

    case 'FORMULA': {
      // price per unit = cost + margin + (cost * markup%)
      const costPrice = Number(product.costPrice ?? baseUnitPrice * 0.7);
      const margin = Number(rule.formulaMargin || 0);
      const markupPercent = Number(rule.formulaMarkup || 0);
      const unitPrice = costPrice + margin + costPrice * (markupPercent / 100);
      calculatedPrice = unitPrice * quantity;
      break;
    }

    default:
      calculatedPrice = baseTotal;
  }

  return Math.max(0, calculatedPrice);
}

/**
 * Get all pricelists (lightweight - optimized for list views)
 * Returns only summary info: name, description, priority, isActive, and counts
 * Avoids fetching all rules/items to improve performance
 */
export async function getAllPricelistsSummary() {
  const pricelists = await prisma.pricelist.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      priority: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          rules: true,
          items: true,
        },
      },
    },
    orderBy: { priority: 'desc' },
  });

  return pricelists;
}

/**
 * Get all pricelists for admin management (with full details)
 * Use this only when you need all rule details. For list views, use getAllPricelistsSummary()
 */
export async function getAllPricelists() {
  return prisma.pricelist.findMany({
    include: {
      rules: {
        include: {
          product: { select: { id: true, name: true, sku: true, costPrice: true, price: true } },
        },
        orderBy: { minQuantity: 'asc' },
      },
      items: true,
    },
    orderBy: { priority: 'desc' },
  });
}

/**
 * Get single pricelist by ID
 */
export async function getPricelistById(id: string) {
  return prisma.pricelist.findUnique({
    where: { id },
    include: {
      rules: {
        include: {
          product: { select: { id: true, name: true, sku: true, costPrice: true, price: true } },
        },
        orderBy: { minQuantity: 'asc' },
      },
      items: true,
    },
  });
}

/**
 * Create new pricelist
 */
export async function createPricelist(data: {
  name: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  rules?: any[];
}) {
  const { rules, ...pricelistData } = data;

  return prisma.pricelist.create({
    data: {
      name: pricelistData.name,
      description: pricelistData.description,
      priority: pricelistData.priority ?? 0,
      isActive: pricelistData.isActive !== false,
      rules: rules
        ? {
            create: rules.map((rule: any) => ({
              productId: rule.productId,
              name: rule.name,
              minQuantity: rule.minQuantity ?? 1,
              maxQuantity: rule.maxQuantity || null,
              calculationType: rule.calculationType,
              discountPercentage: rule.discountPercentage,
              fixedPrice: rule.fixedPrice,
              fixedDiscount: rule.fixedDiscount,
              formulaMargin: rule.formulaMargin,
              formulaMarkup: rule.formulaMarkup,
              isActive: rule.isActive !== false,
            })),
          }
        : undefined,
    },
    include: {
      rules: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });
}

/**
 * Update pricelist
 */
export async function updatePricelist(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    priority: number;
    isActive: boolean;
    rules: any[];
  }>
) {
  const { rules, ...pricelistData } = data;

  if (rules) {
    // Delete existing rules (will be replaced)
    await prisma.pricelistRule.deleteMany({
      where: { pricelistId: id },
    });
  }

  return prisma.pricelist.update({
    where: { id },
    data: {
      ...pricelistData,
      rules: rules
        ? {
            create: rules.map((rule: any) => ({
              productId: rule.productId,
              name: rule.name,
              minQuantity: rule.minQuantity ?? 1,
              maxQuantity: rule.maxQuantity || null,
              calculationType: rule.calculationType,
              discountPercentage: rule.discountPercentage,
              fixedPrice: rule.fixedPrice,
              fixedDiscount: rule.fixedDiscount,
              formulaMargin: rule.formulaMargin,
              formulaMarkup: rule.formulaMarkup,
              isActive: rule.isActive !== false,
            })),
          }
        : undefined,
    },
    include: {
      rules: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });
}

/**
 * Delete pricelist (cascades to rules)
 */
export async function deletePricelist(id: string) {
  return prisma.pricelist.delete({
    where: { id },
  });
}

/**
 * Create pricelist rule
 */
export async function createPricelistRule(
  pricelistId: string,
  data: {
    productId: string;
    name: string;
    minQuantity?: number;
    maxQuantity?: number | null;
    calculationType: string;
    discountPercentage?: number | null;
    fixedPrice?: number | null;
    fixedDiscount?: number | null;
    formulaMargin?: number | null;
    formulaMarkup?: number | null;
    isActive?: boolean;
  }
) {
  return prisma.pricelistRule.create({
    data: {
      pricelistId,
      productId: data.productId,
      name: data.name,
      minQuantity: data.minQuantity ?? 1,
      maxQuantity: data.maxQuantity || null,
      calculationType: data.calculationType,
      discountPercentage: data.discountPercentage,
      fixedPrice: data.fixedPrice,
      fixedDiscount: data.fixedDiscount,
      formulaMargin: data.formulaMargin,
      formulaMarkup: data.formulaMarkup,
      isActive: data.isActive !== false,
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  });
}

/**
 * Update pricelist rule
 */
export async function updatePricelistRule(
  ruleId: string,
  data: Partial<{
    productId: string;
    name: string;
    minQuantity: number;
    maxQuantity: number | null;
    calculationType: string;
    discountPercentage: number | null;
    fixedPrice: number | null;
    fixedDiscount: number | null;
    formulaMargin: number | null;
    formulaMarkup: number | null;
    isActive: boolean;
  }>
) {
  return prisma.pricelistRule.update({
    where: { id: ruleId },
    data,
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  });
}

/**
 * Delete pricelist rule
 */
export async function deletePricelistRule(ruleId: string) {
  return prisma.pricelistRule.delete({
    where: { id: ruleId },
  });
}
