import { AxiosError } from 'axios';

/** Field-level validation errors keyed by field name, matching Laravel-style 422 payloads. */
export type FieldErrors = Record<string, string[]>;

/**
 * Normalized application error.
 * - `message` — human-readable summary
 * - `status` — HTTP status code (if from an API response)
 * - `fieldErrors` — per-field validation messages (populated on 422 responses)
 * - `raw` — original error for debugging
 */
export interface AppError {
  message: string;
  status?: number;
  fieldErrors?: FieldErrors;
  raw?: unknown;
}

/**
 * Converts any thrown value into a typed {@link AppError}.
 * Handles Axios 422 payloads with `{ message, errors }` shape.
 *
 * @param error - The caught value
 * @returns Normalized {@link AppError}
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    return {
      message: data?.message ?? error.message ?? 'Error de red',
      status,
      fieldErrors: status === 422 && data?.errors ? (data.errors as FieldErrors) : undefined,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, raw: error };
  }

  return { message: 'Error desconocido', raw: error };
}

/**
 * Returns the first error message for a given field, or undefined if none.
 *
 * @param fieldErrors - The field errors map
 * @param field - The field name to look up
 */
export function getFieldError(fieldErrors: FieldErrors | undefined, field: string): string | undefined {
  return fieldErrors?.[field]?.[0];
}
