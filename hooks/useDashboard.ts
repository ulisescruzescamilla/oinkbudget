import { useState, useEffect, useCallback } from 'react';
import { AppError, FieldErrors } from '@/utils/errorHandler';
import { DashboardType } from '@/types/DashboardType';
import { dashboardService } from '@/services/DashboardService';

interface DashboardState {
  dashboard: DashboardType | null;
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}


export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    dashboard: {
      "total_expense_today": 0,
      "last_moves": [],
      "daily_limit": 0
    },
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches dashboard from the API. */
  const fetchDashboard = useCallback(async () => {
    // start loading
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    // fetch data
    try {
      const dashboard = await dashboardService.getAll();
      setState({ dashboard, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      // handle error
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...state,
    refresh: fetchDashboard,
    clearFieldErrors,
  };
}
