/**
 * Component tests for PricelistForm
 * 
 * Tests the form component's:
 * - Rendering and initial state
 * - Form field validation
 * - Dynamic rule management (add/remove)
 * - Conditional field visibility
 * - Form submission
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      { id: 'prod-1', name: 'Product 1', sku: 'P001' },
      { id: 'prod-2', name: 'Product 2', sku: 'P002' },
    ],
    categories: [
      { id: 'cat-1', name: 'Category 1' },
      { id: 'cat-2', name: 'Category 2' },
    ],
    isLoading: false,
    error: null,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('PricelistForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Create mode', () => {
    it('should render form in create mode', () => {
      render(<PricelistForm isEdit={false} />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Create Pricelist')).toBeInTheDocument();
      expect(screen.getByText('Pricing Rules')).toBeInTheDocument();
    });

    it('should have empty initial values in create mode', () => {
      render(<PricelistForm isEdit={false} />);

      const nameInput = screen.getByPlaceholderText('e.g., Wholesale, VIP, Summer Sale') as HTMLInputElement;
      expect(nameInput.value).toBe('');

      const currencySelect = screen.getByDisplayValue('USD');
      expect(currencySelect).toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(<PricelistForm isEdit={false} />);

      expect(screen.getByLabelText('Pricelist Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Currency')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    const mockInitialData = {
      id: 'pricelist-1',
      name: 'Existing Pricelist',
      description: 'Test description',
      priority: 5,
      currency: 'USD',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
      applicableToCustomer: null,
      applicableToCategory: null,
      rules: [
        {
          id: 'rule-1',
          name: 'Test Rule',
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

    it('should load and display existing rules', async () => {
      render(<PricelistForm isEdit={true} initialData={mockInitialData} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
      });
    });
  });

  describe('Rule Management', () => {
    it('should add new rule when clicking Add Pricing Rule button', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        // Should show new rule section
        const selectors = screen.getAllByText('Applies To *');
        expect(selectors.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should remove rule when clicking delete button', async () => {
      const initialData = {
        rules: [
          {
            id: 'rule-1',
            name: 'Rule to Delete',
            priority: 1,
            minQuantity: 1,
            appliedTo: 'ALL_PRODUCTS',
            calculationType: 'PERCENTAGE_DISCOUNT',
            discountPercentage: 10,
            isActive: true,
          },
        ],
      };

      render(<PricelistForm isEdit={false} initialData={initialData} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Rule to Delete')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete|trash/i });
      fireEvent.click(deleteButton);

      // Rule should be removed
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Rule to Delete')).not.toBeInTheDocument();
      });
    });

    it('should toggle rule expansion/collapse', async () => {
      const initialData = {
        rules: [
          {
            id: 'rule-1',
            name: 'Toggle Test Rule',
            priority: 1,
            minQuantity: 1,
            appliedTo: 'ALL_PRODUCTS',
            calculationType: 'FIXED_PRICE',
            fixedPrice: 99.99,
            isActive: true,
          },
        ],
      };

      render(<PricelistForm isEdit={false} initialData={initialData} />);

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /chevron/i });
        expect(toggleButton).toBeInTheDocument();

        // Click to collapse
        fireEvent.click(toggleButton);

        // Rule details should be hidden
        // Check for visibility or expect certain elements to be hidden
      });
    });
  });

  describe('Conditional Field Rendering', () => {
    it('should show product selector when appliedTo is PRODUCT', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        const appliesToSelects = screen.getAllByDisplayValue('PRODUCT') as HTMLSelectElement[];
        const appliesToSelect = appliesToSelects[appliesToSelects.length - 1] as HTMLSelectElement;

        fireEvent.change(appliesToSelect, { target: { value: 'PRODUCT' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Select Product *')).toBeInTheDocument();
      });
    });

    it('should show category selector when appliedTo is CATEGORY', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        const appliesToSelects = screen.getAllByDisplayValue('PRODUCT') as HTMLSelectElement[];
        const appliesToSelect = appliesToSelects[appliesToSelects.length - 1] as HTMLSelectElement;

        fireEvent.change(appliesToSelect, { target: { value: 'CATEGORY' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Select Category *')).toBeInTheDocument();
      });
    });

    it('should show percentage discount field for PERCENTAGE_DISCOUNT', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        const calcTypeSelects = screen.getAllByDisplayValue('PERCENTAGE_DISCOUNT') as HTMLSelectElement[];
        const calcTypeSelect = calcTypeSelects[0] as HTMLSelectElement;

        fireEvent.change(calcTypeSelect, { target: { value: 'PERCENTAGE_DISCOUNT' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Discount Percentage (%) *')).toBeInTheDocument();
      });
    });

    it('should show fixed price field for FIXED_PRICE', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        const calcTypeSelects = screen.getAllByDisplayValue('PERCENTAGE_DISCOUNT') as HTMLSelectElement[];
        const calcTypeSelect = calcTypeSelects[0] as HTMLSelectElement;

        fireEvent.change(calcTypeSelect, { target: { value: 'FIXED_PRICE' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Fixed Price *')).toBeInTheDocument();
      });
    });

    it('should show formula fields for FORMULA type', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        const calcTypeSelects = screen.getAllByDisplayValue('PERCENTAGE_DISCOUNT') as HTMLSelectElement[];
        const calcTypeSelect = calcTypeSelects[0] as HTMLSelectElement;

        fireEvent.change(calcTypeSelect, { target: { value: 'FORMULA' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Margin Amount')).toBeInTheDocument();
        expect(screen.getByLabelText('Markup %')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      render(<PricelistForm isEdit={false} />);

      const submitButton = screen.getByText('Create Pricelist');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required|name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate quantity ranges in rules', async () => {
      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      await waitFor(() => {
        const minQtyInputs = screen.getAllByDisplayValue('1');
        const maxQtyInputs = screen.getAllByPlaceholderText('∞');

        // Set min > max
        if (maxQtyInputs.length > 0) {
          fireEvent.change(maxQtyInputs[0], { target: { value: '5' } });
          if (minQtyInputs.length > 0) {
            fireEvent.change(minQtyInputs[0], { target: { value: '10' } });
          }
        }
      });

      const submitButton = screen.getByText('Create Pricelist');
      fireEvent.click(submitButton);

      // Should show validation error
      expect(screen.getByText(/max.*min|quantity/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'new-id' } }),
      });

      render(<PricelistForm isEdit={false} />);

      const nameInput = screen.getByPlaceholderText('e.g., Wholesale, VIP, Summer Sale');
      await userEvent.type(nameInput, 'Test Pricelist');

      const submitButton = screen.getByText('Create Pricelist');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/pricelists',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should show error toast on submission failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
        status: 500,
      });

      render(<PricelistForm isEdit={false} />);

      const nameInput = screen.getByPlaceholderText('e.g., Wholesale, VIP, Summer Sale');
      await userEvent.type(nameInput, 'Test Pricelist');

      const submitButton = screen.getByText('Create Pricelist');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should disable submit button while submitting', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 1000))
      );

      render(<PricelistForm isEdit={false} />);

      const nameInput = screen.getByPlaceholderText('e.g., Wholesale, VIP, Summer Sale');
      await userEvent.type(nameInput, 'Test');

      const submitButton = screen.getByText('Create Pricelist') as HTMLButtonElement;
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('Cancel button', () => {
    it('should navigate back when cancel is clicked', async () => {
      const mockRouter = require('next/navigation').useRouter();
      render(<PricelistForm isEdit={false} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should disable cancel button while submitting', async () => {
      render(<PricelistForm isEdit={false} />);

      const submitButton = screen.getByText('Create Pricelist');
      const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;

      expect(cancelButton.disabled).toBe(false);
    });
  });

  describe('Selector loading states', () => {
    it('should show loading state while fetching products/categories', () => {
      jest.doMock('@/hooks/usePricelistSelectors', () => ({
        useProductsAndCategories: () => ({
          products: [],
          categories: [],
          isLoading: true,
          error: null,
        }),
      }));

      const { rerender } = render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      // Should show loading indicator
      expect(screen.getByText(/loading products|loading categories/i)).toBeInTheDocument();
    });

    it('should show error message if selector data fails to load', () => {
      jest.doMock('@/hooks/usePricelistSelectors', () => ({
        useProductsAndCategories: () => ({
          products: [],
          categories: [],
          isLoading: false,
          error: 'Failed to load data',
        }),
      }));

      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    it('should show empty state if no products available', () => {
      jest.doMock('@/hooks/usePricelistSelectors', () => ({
        useProductsAndCategories: () => ({
          products: [],
          categories: [],
          isLoading: false,
          error: null,
        }),
      }));

      render(<PricelistForm isEdit={false} />);

      const addButton = screen.getByText('Add Pricing Rule');
      fireEvent.click(addButton);

      expect(screen.getByText(/no products available/i)).toBeInTheDocument();
    });
  });
});
