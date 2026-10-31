import { cashFormatRounded, formatDateRange, periodRange } from './formatting';

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe('periodRange', () => {
  it('covers the calendar month for monthly', () => {
    const { start, end } = periodRange('monthly', new Date(2026, 1, 10));
    expect(ymd(start)).toEqual([2026, 2, 1]);
    expect(ymd(end)).toEqual([2026, 2, 28]);
  });

  it('covers days 1–15 for biweekly in the first half of the month', () => {
    const { start, end } = periodRange('biweekly', new Date(2026, 5, 15));
    expect(ymd(start)).toEqual([2026, 6, 1]);
    expect(ymd(end)).toEqual([2026, 6, 15]);
  });

  it('covers day 16 to month end for biweekly in the second half', () => {
    const { start, end } = periodRange('biweekly', new Date(2026, 6, 16));
    expect(ymd(start)).toEqual([2026, 7, 16]);
    expect(ymd(end)).toEqual([2026, 7, 31]);
  });

  it('covers Monday to Sunday for weekly, across a month boundary', () => {
    // Wednesday 1 July 2026.
    const { start, end } = periodRange('weekly', new Date(2026, 6, 1));
    expect(ymd(start)).toEqual([2026, 6, 29]);
    expect(ymd(end)).toEqual([2026, 7, 5]);
  });

  it('treats Sunday as the last day of its week', () => {
    const { start, end } = periodRange('weekly', new Date(2026, 5, 28));
    expect(ymd(start)).toEqual([2026, 6, 22]);
    expect(ymd(end)).toEqual([2026, 6, 28]);
  });

  it('covers the calendar year for yearly', () => {
    const { start, end } = periodRange('yearly', new Date(2026, 5, 28));
    expect(ymd(start)).toEqual([2026, 1, 1]);
    expect(ymd(end)).toEqual([2026, 12, 31]);
  });
});

describe('formatDateRange', () => {
  it('names the month once when both dates share it', () => {
    expect(formatDateRange(new Date(2026, 5, 4), new Date(2026, 5, 30))).toBe('4 – 30 jun 2026');
  });

  it('names both months when the range crosses a month', () => {
    expect(formatDateRange(new Date(2026, 5, 29), new Date(2026, 6, 5))).toBe('29 jun – 5 jul 2026');
  });

  it('names both years when the range crosses a year', () => {
    expect(formatDateRange(new Date(2026, 11, 28), new Date(2027, 0, 3))).toBe('28 dic 2026 – 3 ene 2027');
  });
});

describe('cashFormatRounded', () => {
  it('formats whole pesos without decimals', () => {
    expect(cashFormatRounded(1500)).toBe('$1,500');
    expect(cashFormatRounded(0)).toBe('$0');
  });
});
