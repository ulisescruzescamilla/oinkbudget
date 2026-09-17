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
 * Formats a Date object as a full ISO-8601 instant (with an explicit UTC
 * offset) for API payloads that require `created_at` to be an instant, not
 * a bare calendar date (e.g. expense/income creation). Returns undefined if
 * the value is absent.
 *
 * @param value - Date to format
 */
export const formatApiDateTime = (value?: Date): string | undefined => (value ? value.toISOString() : undefined);

/**
 * Formats a Date object's time-of-day as HH:MM (24h), pinned to `APP_TIME_ZONE`
 * regardless of the device's own system timezone. Returns undefined if the
 * value is absent.
 *
 * @param value - Date to format
 */
export const formatTime = (value?: Date): string | undefined => {
  if (!value) return undefined;
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
};

const MONTH_ABBR_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * True when both dates fall on the same calendar day (local time).
 *
 * @param a - First date
 * @param b - Second date
 */
export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Returns today (or `offsetDays` from today) at local midnight.
 *
 * @param offsetDays - Days to offset from today (negative for the past)
 */
export const dayOffset = (offsetDays = 0): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
};

/**
 * Timezone the app's "today"/day-boundary logic is anchored to (this is a Mexico-only
 * budgeting app), regardless of the device's own system timezone.
 */
export const APP_TIME_ZONE = 'America/Mexico_City';

/**
 * A Date's calendar date in `APP_TIME_ZONE`, as a Y-m-d string. Prefer this over
 * `formatApiDate` (which uses the device's local calendar) when grouping or labeling entries
 * by day needs to follow Mexico City's day boundary regardless of the device's own timezone.
 */
export const formatDateInAppTimeZone = (value: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE }).format(value);

/**
 * Today's calendar date in `APP_TIME_ZONE`, as a Y-m-d string. Prefer this over
 * device-local midnight (e.g. `dayOffset(0)`) for "is this today" checks, so a device set to
 * a different timezone doesn't shift what counts as today.
 */
export const todayInAppTimeZone = (): string => formatDateInAppTimeZone(new Date());

/**
 * `todayInAppTimeZone()` offset by `days` (negative for the past), as a Y-m-d string.
 *
 * @param days - Days to offset from today in `APP_TIME_ZONE` (negative for the past)
 */
export const dayInAppTimeZone = (days: number): string => {
  const [y, m, d] = todayInAppTimeZone().split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * A stored instant's full calendar date ("1 junio 2026"), pinned to
 * `APP_TIME_ZONE` regardless of the device's own system timezone. Use this
 * (not `toLocaleDateString`) whenever displaying a transaction's `created_at`,
 * so it always agrees with the day it's grouped under elsewhere in the app.
 *
 * @param value - Date to format
 */
export const formatDisplayDate = (value: Date): string =>
  new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);

/**
 * Humanizes a device-local `Date` as "Hoy", "Ayer", or "D mon[ año]" (Spanish).
 * Appends the year only when it isn't the current one. Intended for values the
 * user is actively picking on their own device (e.g. the `DateField` picker),
 * not for displaying a stored `created_at` instant — for that, use
 * `formatDisplayDate` so it's pinned to `APP_TIME_ZONE` instead of device-local.
 *
 * @param value - Date to humanize
 */
export const dayLabel = (value: Date): string => {
  const today = dayOffset(0);
  if (isSameDay(value, today)) return 'Hoy';
  if (isSameDay(value, dayOffset(-1))) return 'Ayer';
  const year = value.getFullYear() !== today.getFullYear() ? ` ${value.getFullYear()}` : '';
  return `${value.getDate()} ${MONTH_ABBR_ES[value.getMonth()]}${year}`;
};

export const cashFormat = (amount: number | undefined): string => {
  if (!amount) {
    return '$ 0'
  }

  const formatted = Intl.NumberFormat('es-MX', {
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