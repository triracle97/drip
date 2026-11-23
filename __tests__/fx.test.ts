import { hasRate, localPrice } from '@/lib/fx';

describe('localPrice', () => {
  it('USD unchanged', () => {
    expect(localPrice(15.99, 'USD')).toBe(15.99);
  });
  it('decimal currencies get .99 endings', () => {
    expect(localPrice(15.99, 'EUR')).toBe(14.99);
    expect(localPrice(10.99, 'GBP')).toBe(8.99);
  });
  it('zero-decimal currencies round to plausible steps', () => {
    expect(localPrice(15.99, 'JPY')).toBe(2400);
    expect(localPrice(15.99, 'VND')).toBe(406000);
    expect(localPrice(2.99, 'KRW')).toBe(4040);
  });
  it('unknown currency falls back to the USD amount', () => {
    expect(hasRate('XYZ')).toBe(false);
    expect(localPrice(9.99, 'XYZ')).toBe(9.99);
  });
});
