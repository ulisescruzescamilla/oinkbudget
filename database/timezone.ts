/**
 * expo-sqlite's date functions only understand 'utc' and 'localtime' (the device's own OS
 * zone) — there's no IANA timezone database to ask for 'America/Mexico_City' directly. Mexico
 * abolished DST nationwide in 2022 (aside from a few border municipalities), so Mexico City
 * time is now a fixed UTC-6 offset. Shifting a `created_at` column (stored as UTC ISO) by this
 * modifier before taking `DATE(...)` aligns day-boundary grouping/filtering with Mexico City's
 * calendar day, regardless of the device's own timezone.
 *
 * Bind it as a parameter, e.g. `DATE(created_at, ?)` with `[CDMX_SQL_SHIFT]`.
 */
export const CDMX_SQL_SHIFT = '-6 hours';
