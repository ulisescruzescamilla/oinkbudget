import { useState, useCallback, useEffect } from 'react';
import { categoryService } from '@/services/categoryService';
import { CategoryType } from '@/types/CategoryType';
import { AppError } from '@/utils/errorHandler';

interface CategoriesState {
  categories: CategoryType[];
  loading: boolean;
  error: AppError | null;
}

export function useCategories() {
  const [state, setState] = useState<CategoriesState>({
    categories: [],
    loading: false,
    error: null,
  });

  const fetchCategories = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const categories = await categoryService.getAll();
      setState({ categories, loading: false, error: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return { ...state, refresh: fetchCategories };
}
