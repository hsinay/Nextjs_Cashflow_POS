import { calculateProductPrice, getAllPricelists, getPricelistById, createPricelist } from '@/services/pricelist.service';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
    },
    pricelist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PricelistService - calculateProductPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct = {
    id: 'product-1',
    name: 'Premium Widget',
    sku: 'PWG-001',
    price: new Decimal('100.00'),
    costPrice: new Decimal('70.00'),
    category: {
      id: 'category-1',
      name: 'Electronics',
      parentCategoryId: null,
    },
    categoryId: 'category-1',
  };

  describe('PERCENTAGE_DISCOUNT calculation', () => {
    it('should apply percentage discount correctly', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const mockRule = {
        id: 'rule-1',
        name: '10% Discount',
        pricelist: null,
        pricelistId: 'pricelist-1',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'PRODUCT',
        productId: 'product-1',
        categoryId: null,
        customerGroupId: null,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('10'),
        fixedPrice: null,
        fixedDiscount: null,
        formulaMargin: null,
        formulaMarkup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          name: 'Standard Discount',
          description: null,
          priority: 1,
          currency: 'USD',
          startDate: null,
          endDate: null,
          applicableToCustomer: null,
          applicableToCategory: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          rules: [mockRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.basePrice).toBe(100);
      expect(result.calculatedPrice).toBe(90); // 100 - (100 * 0.10)
      expect(result.discount).toBe(10);
      expect(result.discountPercentage).toBe(10);
      expect(result.appliedRule?.ruleName).toBe('10% Discount');
    });

    it('should apply max discount of 100%', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const mockRule = {
        id: 'rule-1',
        name: '100% Discount',
        pricelist: null,
        pricelistId: 'pricelist-1',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'PRODUCT',
        productId: 'product-1',
        categoryId: null,
        customerGroupId: null,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('100'),
        fixedPrice: null,
        fixedDiscount: null,
        formulaMargin: null,
        formulaMarkup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          rules: [mockRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 1,
      });

      expect(result.calculatedPrice).toBe(0);
    });
  });

  describe('FIXED_PRICE calculation', () => {
    it('should apply fixed price regardless of base price', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const mockRule = {
        id: 'rule-1',
        name: 'Fixed Price',
        pricelist: null,
        pricelistId: 'pricelist-1',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'ALL_PRODUCTS',
        productId: null,
        categoryId: null,
        customerGroupId: null,
        calculationType: 'FIXED_PRICE',
        discountPercentage: null,
        fixedPrice: new Decimal('75.00'),
        fixedDiscount: null,
        formulaMargin: null,
        formulaMarkup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          name: 'Promotional Price',
          description: null,
          priority: 1,
          currency: 'USD',
          startDate: null,
          endDate: null,
          applicableToCustomer: null,
          applicableToCategory: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          rules: [mockRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 10,
      });

      expect(result.basePrice).toBe(100);
      expect(result.calculatedPrice).toBe(75);
      expect(result.discount).toBe(25);
    });
  });

  describe('FIXED_DISCOUNT calculation', () => {
    it('should apply fixed discount amount', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const mockRule = {
        id: 'rule-1',
        name: 'Fixed Discount',
        pricelist: null,
        pricelistId: 'pricelist-1',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'ALL_PRODUCTS',
        productId: null,
        categoryId: null,
        customerGroupId: null,
        calculationType: 'FIXED_DISCOUNT',
        discountPercentage: null,
        fixedPrice: null,
        fixedDiscount: new Decimal('15.00'),
        formulaMargin: null,
        formulaMarkup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          name: 'Standard Price',
          description: null,
          priority: 1,
          currency: 'USD',
          startDate: null,
          endDate: null,
          applicableToCustomer: null,
          applicableToCategory: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          rules: [mockRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.basePrice).toBe(100);
      expect(result.calculatedPrice).toBe(85); // 100 - 15
      expect(result.discount).toBe(15);
    });

    it('should not allow negative price after fixed discount', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const mockRule = {
        id: 'rule-1',
        calculationType: 'FIXED_DISCOUNT',
        fixedDiscount: new Decimal('150.00'), // More than base price
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'ALL_PRODUCTS',
        priority: 1,
        isActive: true,
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          priority: 1,
          rules: [mockRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 1,
      });

      expect(result.calculatedPrice).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quantity range matching', () => {
    it('should match rules within quantity range', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const smallOrderRule = {
        id: 'rule-1',
        name: 'Small Order - 5% off',
        pricelist: null,
        pricelistId: 'pricelist-1',
        priority: 1,
        minQuantity: 1,
        maxQuantity: 10,
        appliedTo: 'ALL_PRODUCTS',
        productId: null,
        categoryId: null,
        customerGroupId: null,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('5'),
        fixedPrice: null,
        fixedDiscount: null,
        formulaMargin: null,
        formulaMarkup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bulkRule = {
        id: 'rule-2',
        name: 'Bulk Order - 15% off',
        pricelist: null,
        pricelistId: 'pricelist-1',
        priority: 2,
        minQuantity: 11,
        maxQuantity: null,
        appliedTo: 'ALL_PRODUCTS',
        productId: null,
        categoryId: null,
        customerGroupId: null,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('15'),
        fixedPrice: null,
        fixedDiscount: null,
        formulaMargin: null,
        formulaMarkup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          name: 'Quantity Based',
          description: null,
          priority: 1,
          currency: 'USD',
          startDate: null,
          endDate: null,
          applicableToCustomer: null,
          applicableToCategory: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          rules: [smallOrderRule, bulkRule],
        },
      ] as any);

      // Test small quantity
      const smallResult = await calculateProductPrice({
        productId: 'product-1',
        quantity: 5,
      });
      expect(smallResult.calculatedPrice).toBe(95); // 5% off

      mockPrisma.pricelist.findMany.mockClear();
      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          rules: [smallOrderRule, bulkRule],
        },
      ] as any);

      // Test bulk quantity
      const bulkResult = await calculateProductPrice({
        productId: 'product-1',
        quantity: 20,
      });
      expect(bulkResult.calculatedPrice).toBe(85); // 15% off
    });
  });

  describe('Priority-based rule evaluation', () => {
    it('should apply highest priority matching rule', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const lowPriorityRule = {
        id: 'rule-1',
        name: 'Low Priority',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'ALL_PRODUCTS',
        isActive: true,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('5'),
      };

      const highPriorityRule = {
        id: 'rule-2',
        name: 'High Priority',
        priority: 10,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'ALL_PRODUCTS',
        isActive: true,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('20'),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          priority: 1,
          rules: [highPriorityRule, lowPriorityRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.appliedRule?.ruleName).toBe('High Priority');
      expect(result.calculatedPrice).toBe(80); // 20% off
    });
  });

  describe('Product not found', () => {
    it('should throw error when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        calculateProductPrice({
          productId: 'invalid-product',
          quantity: 1,
        })
      ).rejects.toThrow('Product invalid-product not found');
    });
  });

  describe('No matching rule', () => {
    it('should return base price when no rules match', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      mockPrisma.pricelist.findMany.mockResolvedValue([]);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.basePrice).toBe(100);
      expect(result.calculatedPrice).toBe(100);
      expect(result.discount).toBe(0);
      expect(result.discountPercentage).toBe(0);
      expect(result.appliedRule).toBeNull();
    });
  });

  describe('Category filtering', () => {
    it('should apply rule for matching product category', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const categoryRule = {
        id: 'rule-1',
        name: 'Electronics Discount',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'CATEGORY',
        categoryId: 'category-1',
        productId: null,
        customerGroupId: null,
        isActive: true,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('12'),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          priority: 1,
          applicableToCategory: null,
          applicableToCustomer: null,
          rules: [categoryRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 1,
        categoryId: 'category-1',
      });

      expect(result.appliedRule?.ruleName).toBe('Electronics Discount');
      expect(result.calculatedPrice).toBe(88); // 12% off
    });

    it('should skip rule for non-matching category', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const categoryRule = {
        id: 'rule-1',
        name: 'Different Category',
        priority: 1,
        minQuantity: 1,
        maxQuantity: null,
        appliedTo: 'CATEGORY',
        categoryId: 'category-2', // Different category
        productId: null,
        customerGroupId: null,
        isActive: true,
        calculationType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: new Decimal('20'),
      };

      mockPrisma.pricelist.findMany.mockResolvedValue([
        {
          id: 'pricelist-1',
          priority: 1,
          rules: [categoryRule],
        },
      ] as any);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 1,
        categoryId: 'category-1',
      });

      expect(result.appliedRule).toBeNull();
      expect(result.calculatedPrice).toBe(100);
    });
  });

  describe('Date range filtering', () => {
    it('should only apply active pricelists within date range', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      mockPrisma.pricelist.findMany.mockResolvedValue([]);

      const result = await calculateProductPrice({
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.calculatedPrice).toBe(100);
      expect(mockPrisma.pricelist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            AND: expect.arrayContaining([
              { OR: [{ startDate: null }, { startDate: { lte: expect.any(Date) } }] },
              { OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) } }] },
            ]),
          }),
        })
      );
    });
  });
});
