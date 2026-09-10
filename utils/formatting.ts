/**
 * Formats a Date object into a Y-m-d string for API payloads.
 * Returns undefined if the value is absent.
 *
 * @param value - Date to format
 */
export const formatApiDate = (value?: Date): string | undefined => {
  if (!value) return undefined;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Parses a Y-m-d date string (from the API or local storage) into a local Date object.
 * Appends T00:00:00 to avoid timezone shifts when parsing date-only strings.
 * Returns undefined if the value is absent.
 *
 * @param value - Date string in Y-m-d format (e.g. "2024-01-15")
 */
export const parseApiDate = (value?: string | null): Date | undefined =>
  value ? new Date(`${value}T00:00:00`) : undefined;

/**
 * Formats a Date object's time-of-day as HH:MM (24h, local time).
 * Returns undefined if the value is absent.
 *
 * @param value - Date to format
 */
export const formatTime = (value?: Date): string | undefined => {
  if (!value) return undefined;
  const h = String(value.getHours()).padStart(2, '0');
  const m = String(value.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const cashFormat = (amount: number | undefined): string => {
  if (!amount) {
    return '$ 0'
  }

  const formatted = Intl.NumberFormat('es-Mx', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)

  return formatted || ''
}

/**
 * Formats an amount as MXN currency with an explicit +/− sign.
 * Useful for transaction rows where direction matters.
 *
 * @param amount - Signed amount (negative = expense, positive = income)
 */
export const signedCash = (amount: number): string => {
  const sign = amount < 0 ? '−' : '+'
  return `${sign}${cashFormat(Math.abs(amount))}`
}