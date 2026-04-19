import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NumericKeypad } from '@/components/pos/numeric-keypad';
import { setActiveCurrency } from '@/lib/currency';

jest.mock('@/lib/currency-context', () => ({
  useCurrency: () => ({
    activeCurrency: 'USD',
    currencySymbol: '$',
    isLoading: false,
    formatCurrency: (amount: number | string) => String(amount),
    setCurrency: jest.fn(),
    availableCurrencies: [],
  }),
}));

function NumericKeypadHarness() {
  const [value, setValue] = React.useState('0.00');

  return <NumericKeypad value={value} onValueChange={setValue} />;
}

describe('NumericKeypad', () => {
  beforeEach(() => {
    setActiveCurrency('USD');
  });

  it('accepts direct amount typing instead of paise-style digit shifting', async () => {
    render(<NumericKeypadHarness />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '5' } });
    expect(input).toHaveValue('5');

    fireEvent.change(input, { target: { value: '56' } });
    expect(input).toHaveValue('56');

    fireEvent.blur(input);
    await waitFor(() => expect(input).toHaveValue('56.00'));
  });

  it('lets keypad buttons build whole amounts', async () => {
    render(<NumericKeypadHarness />);

    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '6' }));

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('56.00'));
  });
});
