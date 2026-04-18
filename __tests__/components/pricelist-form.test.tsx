/**
 * Component tests for PricelistForm
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PricelistForm } from '@/components/pricelists/pricelist-form';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock usePricelistSelectors hook
jest.mock('@/hooks/usePricelistSelectors', () => ({
  useProductsAndCategories: () => ({
    products: [
      { id: 'prod-1', name: 'Product 1', sku: 'P001', price: 100 },
      { id: 'prod-2', name: 'Product 2', sku: 'P002', price: 200 },
    ],
    categories: [],
    isLoading: false,
    error: null,
  }),
}));

global.fetch = jest.fn();

describe('PricelistForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Create mode', () => {
    it('should render form in create mode', () => {
      render(<PricelistForm isEdit={false} />);

      expect(screen.getByText('Pricelist Information')).toBeInTheDocument();
      expect(screen.getByText('Create Pricelist')).toBeInTheDocument();
      expect(screen.getByText('📦 Product Pricing Tiers')).toBeInTheDocument();
    });

    it('should have empty initial values in create mode', () => {
      render(<PricelistForm isEdit={false} />);

      const nameInput = screen.getByPlaceholderText('e.g., Wholesale, VIP, Summer Sale') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });

  describe('Edit mode', () => {
    const mockInitialData = {
      id: 'pricelist-1',
      name: 'Existing Pricelist',
      description: 'Test description',
      priority: 5,
      currency: 'USD',
      isActive: true,
      rules: [
        {
          id: 'rule-1',
          name: 'Tier 1',
          priority: 1,
          minQuantity: 10,
          maxQuantity: 100,
          appliedTo: 'PRODUCT',
          productId: 'prod-1',
          calculationType: 'PERCENTAGE_DISCOUNT',
          discountPercentage: 15,
          isActive: true,
        },
      ],
    };

    it('should populate form with initial data in edit mode', async () => {
      render(<PricelistForm isEdit={true} initialData={mockInitialData} />);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Existing Pricelist') as HTMLInputElement;
        expect(nameInput.value).toBe('Existing Pricelist');
      });
    });

    it('should display Update button in edit mode', () => {
      render(<PricelistForm isEdit={true} initialData={mockInitialData} />);

      expect(screen.getByText('Update Pricelist')).toBeInTheDocument();
    });
  });
});
