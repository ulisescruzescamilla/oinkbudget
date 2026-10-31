import { useState, useCallback, useEffect } from 'react';
import { categoryService, CategoryPayload } from '@/services/categoryService';
import { CategoryType } from '@/types/CategoryType';
import { AppError, FieldErrors } from '@/utils/errorHandler';

interface CategoriesState {
  categories: CategoryType[];
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}

/** Sorts categories by name, keeping the cache's `ORDER BY name` order after mutations. */
const byName = (a: CategoryType, b: CategoryType) => a.name.localeCompare(b.name, 'es');

/**
 * Manages categories state and exposes CRUD operations backed by the API.
 * Loads on mount; surfaces per-field validation errors from 422 responses in
 * `fieldErrors`.
 */
export function useCategories() {
  const [state, setState] = useState<CategoriesState>({
    categories: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null, error: null }));
  }, []);

  /** Fetches all categories (API first, local cache when offline). */
  const fetchCategories = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const categories = await categoryService.getAll();
      setState({ categories, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /**
   * Records a failed mutation in state.
   *
   * @param err - The thrown value (already normalized by the API client)
   */
  const fail = (err: unknown) => {
    const appErr = err as AppError;
    console.error(err);
    setState((s) => ({ ...s, loading: false, error: appErr, fieldErrors: appErr.fieldErrors ?? null }));
  };

  /**
   * Creates a category. Populates `fieldErrors` on 422.
   *
   * @param payload - Name, color and icon of the new category
   * @returns The created category, or undefined on error
   */
  async function createCategory(payload: CategoryPayload): Promise<CategoryType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const created = await categoryService.create(payload);
      setState((s) => ({ ...s, loading: false, categories: [...s.categories, created].sort(byName) }));
      return created;
    } catch (err) {
      fail(err);
    }
  }

  /**
   * Updates a category. Populates `fieldErrors` on 422.
   *
   * @param category - The category with its new values, including its id
   * @returns The updated category, or undefined on error
   */
  async function updateCategory(category: CategoryType): Promise<CategoryType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const { id, ...payload } = category;
      const updated = await categoryService.update(id, payload);
      setState((s) => ({
        ...s,
        loading: false,
        categories: s.categories.map((c) => (c.id === id ? updated : c)).sort(byName),
      }));
      return updated;
    } catch (err) {
      fail(err);
    }
  }

  /**
   * Deletes a category. Populates `error` on failure.
   *
   * @param category - The category to remove
   * @returns Whether the delete succeeded
   */
  async function removeCategory(category: CategoryType): Promise<boolean> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      await categoryService.remove(category.id);
      setState((s) => ({ ...s, loading: false, categories: s.categories.filter((c) => c.id !== category.id) }));
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  }

  return {
    ...state,
    refresh: fetchCategories,
    clearFieldErrors,
    createCategory,
    updateCategory,
    removeCategory,
  };
}
