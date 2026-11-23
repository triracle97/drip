import { formatNumberWith, parseFormattedWith, separatorsFor } from '@/hooks/useNumberFormat';

const en = separatorsFor('en');
const vi = separatorsFor('vi');

/** Simulate typing character by character through the controlled input. */
function type(chars: string, seps = en) {
  let display = '';
  let canonical = '';
  for (const c of chars) {
    canonical = parseFormattedWith(display + c, seps);
    display = formatNumberWith(canonical, seps);
  }
  return { display, canonical };
}

describe('number input', () => {
  it('en: groups thousands and keeps decimals', () => {
    expect(type('1234.56')).toEqual({ display: '1,234.56', canonical: '1234.56' });
  });

  it('vi with a vi keyboard (comma decimal)', () => {
    expect(type('1234,5', vi)).toEqual({ display: '1.234,5', canonical: '1234.5' });
  });

  it('vi app on a US-region keyboard ("." key) can still enter decimals (regression)', () => {
    expect(type('12.5', vi)).toEqual({ display: '12,5', canonical: '12.5' });
    expect(type('15000.99', vi)).toEqual({ display: '15.000,99', canonical: '15000.99' });
  });

  it('en app on a comma-decimal keyboard can enter decimals', () => {
    expect(type('9,99')).toEqual({ display: '9.99', canonical: '9.99' });
  });

  it('deleting a digit from a grouped number keeps it an integer', () => {
    // "1.000" (vi) → backspace → "1.00" must mean 100, not 1.00
    expect(parseFormattedWith('1.00', vi)).toBe('100');
    expect(parseFormattedWith('1,00', en)).toBe('100');
  });

  it('leading decimal', () => {
    expect(type('.5')).toEqual({ display: '0.5', canonical: '0.5' });
  });

  it('empty', () => {
    expect(formatNumberWith('', en)).toBe('');
    expect(parseFormattedWith('', en)).toBe('');
  });
});
