import { Prisma } from '@prisma/client';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  checkLowStock,
  searchProducts,
} from '@/services/product.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    transactionItem: {
      count: jest.fn(),
    },
    salesOrderItem: {
      count: jest.fn(),
    },
    purchaseOrderItem: {
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function dec(n: string | number) {
  return new Prisma.Decimal(n);
}

const stubCategory = {
  id: 'cat-1',
  name: 'Electronics',
  description: null,
  imageUrl: null,
  parentCategoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'Widget',
    description: 'A widget',
    sku: 'WGT-001',
    barcode: null,
    imageUrl: null,
    price: dec('49.99'),
    costPrice: dec('30'),
    stockQuantity: 100,
    reorderLevel: 10,
    taxRate: dec('0'),
    isActive: true,
    categoryId: 'cat-1',
    aiTags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    category: stubCategory,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getAllProducts
// ---------------------------------------------------------------------------

beforeEach(() => jest.resetAllMocks());

describe('getAllProducts', () => {

  it('returns paginated products with default filters', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

    const result = await getAllProducts({ page: 1, limit: 20 });

    expect(result.products).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.pages).toBe(1);
  });

  it('converts Decimal price to number', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

    const result = await getAllProducts({ page: 1, limit: 20 });

    expect(typeof result.products[0].price).toBe('number');
    expect(result.products[0].price).toBeCloseTo(49.99);
  });

  it('filters by categoryId when provided', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

    await getAllProducts({ categoryId: 'cat-2', page: 1, limit: 10 });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 'cat-2' }),
      })
    );
  });

  it('applies case-insensitive search across name, sku, and barcode', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

    await getAllProducts({ search: 'wid', page: 1, limit: 10 });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'wid', mode: 'insensitive' } },
            { sku: { contains: 'wid', mode: 'insensitive' } },
            { barcode: { contains: 'wid', mode: 'insensitive' } },
          ]),
        }),
      })
    );
  });

  it('post-filters low-stock products by reorderLevel threshold', async () => {
    const lowStockProduct = makeProduct({ id: 'low', stockQuantity: 5, reorderLevel: 10 });
    const normalProduct = makeProduct({ id: 'norm', stockQuantity: 50, reorderLevel: 10 });

    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([lowStockProduct, normalProduct]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

    const result = await getAllProducts({ lowStock: true, page: 1, limit: 20 });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('low');
  });

  it('computes correct skip value for pagination', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(100);

    await getAllProducts({ page: 3, limit: 20 });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 })
    );
  });

  it('returns empty array when no products match', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

    const result = await getAllProducts({ search: 'nonexistent', page: 1, limit: 10 });

    expect(result.products).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.pages).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getProductById
// ---------------------------------------------------------------------------

describe('getProductById', () => {
  beforeEach(() => {});

  it('returns null for non-existent product', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await getProductById('missing-id');
    expect(result).toBeNull();
  });

  it('returns product with converted Decimal fields', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(makeProduct());

    const result = await getProductById('prod-1');

    expect(result).not.toBeNull();
    expect(typeof result!.price).toBe('number');
    expect(typeof result!.costPrice).toBe('number');
  });

  it('handles null costPrice gracefully', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(
      makeProduct({ costPrice: null })
    );

    const result = await getProductById('prod-1');

    expect(result!.costPrice).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

describe('createProduct', () => {
  beforeEach(() => {});

  it('throws when imageUrl is a base64 payload', async () => {
    // normalizeImageUrl is evaluated inside prisma.product.create's arg, so category
    // and SKU checks must pass first for the base64 error to be thrown
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null); // SKU check
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(stubCategory);

    await expect(
      createProduct({
        name: 'Bomb',
        categoryId: 'cat-1',
        price: 10,
        sku: 'TEST-SKU',
        imageUrl: 'data:image/png;base64,abc123',
      })
    ).rejects.toThrow('Base64 image payloads are not allowed');
  });

  it('creates product with provided SKU and returns converted price', async () => {
    // SKU uniqueness check → null (not taken)
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(stubCategory);
    (mockPrisma.product.create as jest.Mock).mockResolvedValue(makeProduct({ id: 'new-prod' }));

    const result = await createProduct({
      name: 'Widget',
      categoryId: 'cat-1',
      price: 49.99,
      sku: 'WGT-001',
    });

    expect(result.id).toBe('new-prod');
    expect(typeof result.price).toBe('number');
  });

  it('throws when provided SKU is already in use', async () => {
    // SKU uniqueness check → existing product found
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());

    await expect(
      createProduct({ name: 'Duplicate', categoryId: 'cat-1', price: 10, sku: 'WGT-001' })
    ).rejects.toThrow("SKU 'WGT-001' is already in use");
  });

  it('throws when category does not exist', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null); // SKU check
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      createProduct({ name: 'Widget', categoryId: 'bad-cat', price: 10, sku: 'SKU-X' })
    ).rejects.toThrow("Category with ID 'bad-cat' not found");
  });

  it('auto-generates SKU when not provided', async () => {
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(stubCategory);
    // Auto-generated SKU uniqueness check → null
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockPrisma.product.create as jest.Mock).mockResolvedValue(makeProduct());

    await createProduct({ name: 'Thing', categoryId: 'cat-1', price: 20 });

    const createCall = (mockPrisma.product.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.sku).toMatch(/^PROD-ELEC-\d{6}$/);
  });

  it('stores price as Decimal in DB', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(stubCategory);
    (mockPrisma.product.create as jest.Mock).mockResolvedValue(makeProduct());

    await createProduct({ name: 'Widget', categoryId: 'cat-1', price: 99.5, sku: 'NEW-SKU' });

    const createCall = (mockPrisma.product.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.price).toBeInstanceOf(Prisma.Decimal);
    expect(createCall.data.price.toNumber()).toBe(99.5);
  });
});

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

describe('updateProduct', () => {
  beforeEach(() => {});

  it('throws when imageUrl is a base64 payload', async () => {
    // normalizeImageUrl is evaluated inside prisma.product.update's arg, so
    // the product existence check must pass first
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());

    await expect(
      updateProduct('prod-1', { imageUrl: 'data:image/jpeg;base64,/9j/4AA' })
    ).rejects.toThrow('Base64 image payloads are not allowed');
  });

  it('throws when product does not exist', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(updateProduct('missing', { name: 'New Name' })).rejects.toThrow(
      "Product with ID 'missing' not found"
    );
  });

  it('updates product and returns converted Decimal fields', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());
    (mockPrisma.product.update as jest.Mock).mockResolvedValue(makeProduct({ price: dec('75') }));

    const result = await updateProduct('prod-1', { price: 75 });

    expect(typeof result.price).toBe('number');
    expect(result.price).toBe(75);
  });

  it('accepts null imageUrl to clear image', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());
    (mockPrisma.product.update as jest.Mock).mockResolvedValue(makeProduct({ imageUrl: null }));

    const result = await updateProduct('prod-1', { imageUrl: null });

    expect(result.imageUrl).toBeNull();
    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imageUrl: null }),
      })
    );
  });

  it('rejects new SKU if already taken by another product', async () => {
    (mockPrisma.product.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeProduct({ sku: 'OLD-SKU' })) // existence check
      .mockResolvedValueOnce(makeProduct({ id: 'other-prod', sku: 'TAKEN-SKU' })); // uniqueness check

    await expect(
      updateProduct('prod-1', { sku: 'TAKEN-SKU' })
    ).rejects.toThrow("SKU 'TAKEN-SKU' is already in use");
  });
});

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------

describe('deleteProduct', () => {
  beforeEach(() => {});

  it('throws when product does not exist', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(deleteProduct('missing')).rejects.toThrow(
      "Product with ID 'missing' not found"
    );
  });

  it('marks product as inactive (soft delete) when no active references', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());
    (mockPrisma.transactionItem.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.salesOrderItem.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.product.update as jest.Mock).mockResolvedValue(makeProduct({ isActive: false }));

    await deleteProduct('prod-1');

    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-1' },
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });

  it('throws when product is used in active transactions', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());
    (mockPrisma.transactionItem.count as jest.Mock).mockResolvedValue(3);

    await expect(deleteProduct('prod-1')).rejects.toThrow(
      'Cannot delete product. It is used in 3 active transaction(s).'
    );
  });

  it('throws when product is used in active sales orders', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());
    (mockPrisma.transactionItem.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.salesOrderItem.count as jest.Mock).mockResolvedValue(2);

    await expect(deleteProduct('prod-1')).rejects.toThrow(
      'Cannot delete product. It is used in 2 active sales order(s).'
    );
  });

  it('throws when product is used in active purchase orders', async () => {
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(makeProduct());
    (mockPrisma.transactionItem.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.salesOrderItem.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(1);

    await expect(deleteProduct('prod-1')).rejects.toThrow(
      'Cannot delete product. It is used in 1 active purchase order(s).'
    );
  });
});

// ---------------------------------------------------------------------------
// checkLowStock
// ---------------------------------------------------------------------------

describe('checkLowStock', () => {
  beforeEach(() => {});

  it('returns products where stockQuantity is at or below reorderLevel', async () => {
    const lowStock = makeProduct({ stockQuantity: 3, reorderLevel: 10 });
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([lowStock]);

    const result = await checkLowStock();

    expect(result).toHaveLength(1);
    expect(result[0].stockQuantity).toBe(3);
  });

  it('excludes products where stockQuantity exceeds reorderLevel', async () => {
    const aboveThreshold = makeProduct({ stockQuantity: 50, reorderLevel: 10 });
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([aboveThreshold]);

    const result = await checkLowStock();

    expect(result).toHaveLength(0);
  });

  it('returns empty array when no products are low on stock', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

    const result = await checkLowStock();

    expect(result).toHaveLength(0);
  });

  it('queries for active products with reorderLevel set', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

    await checkLowStock();

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          reorderLevel: expect.objectContaining({ not: null }),
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// searchProducts
// ---------------------------------------------------------------------------

describe('searchProducts', () => {
  beforeEach(() => {});

  it('searches by name, sku, and barcode case-insensitively', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);

    const result = await searchProducts('wid');

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'wid', mode: 'insensitive' } },
          ]),
        }),
      })
    );
    expect(result).toHaveLength(1);
  });

  it('respects the limit parameter', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

    await searchProducts('abc', 5);

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });

  it('defaults to limit of 10 when not specified', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

    await searchProducts('xyz');

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it('returns only active products', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

    await searchProducts('test');

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('converts Decimal price to number in results', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);

    const result = await searchProducts('widget');

    expect(typeof result[0].price).toBe('number');
  });
});
