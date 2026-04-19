import { parseLocaleAmount, setActiveCurrency } from '@/lib/currency';

describe('parseLocaleAmount', () => {
  it('parses plain editable values under NPR locale', () => {
    setActiveCurrency('NPR');

    expect(parseLocaleAmount('56')).toBe(56);
    expect(parseLocaleAmount('56.75')).toBe(56.75);
  });

  it('parses localized formatted values under NPR locale', () => {
    setActiveCurrency('NPR');

    expect(parseLocaleAmount('५६.७५')).toBe(56.75);
    expect(parseLocaleAmount('१,२३४.५०')).toBe(1234.5);
    expect(parseLocaleAmount('₨१,२३४.५०')).toBe(1234.5);
  });
});
