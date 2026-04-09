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