import apiClient from '@/api/client';
import { DashboardType } from '@/types/DashboardType';
import { BudgetPeriodType } from '@/types/BudgetType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import { getDBConnection } from '@/database';
import * as balanceRepository from '@/database/balanceRepository';
import * as budgetRepository from '@/database/budgetRepository';
import * as expenseRepository from '@/database/expenseRepository';

const PERIOD_DAYS: Record<BudgetPeriodType, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  yearly: 365,
};

async function getExpenseTrend(days: number): Promise<{ d: string; v: number }[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<{ d: string; v: number }>(
    `SELECT DATE(created_at) as d, SUM(amount) as v FROM balances
     WHERE type = 'expense' AND deleted = 0 AND DATE(created_at) >= DATE('now', ?)
     GROUP BY DATE(created_at) ORDER BY d ASC;`,
    [`-${days - 1} days`]
  );
  return rows;
}

/**
 * Builds a `DashboardType`-shaped object from the local mirrors when the API
 * is unreachable. `daily_limit` is an approximation (sum of each active
 * budget's `max_limit` spread evenly over its period) — the real backend
 * formula isn't visible from this repo, so validate against actual API
 * behavior before relying on it.
 */
async function computeLocalDashboard(): Promise<DashboardType> {
  const [totalToday, trend, budgets, lastExpenses] = await Promise.all([
    balanceRepository.getTodayExpensesTotal(),
    getExpenseTrend(7),
    budgetRepository.getAll(),
    expenseRepository.getAll(),
  ]);

  const today = new Date();
  const activeBudgets = budgets.filter((b) => {
    if (b.is_recurrent) return true;
    if (!b.start_date || !b.end_date) return false;
    return b.start_date <= today && today <= b.end_date;
  });

  const dailyLimit = activeBudgets.reduce((sum, b) => sum + b.max_limit / PERIOD_DAYS[b.period], 0);
  const totalExpenseToday = totalToday?.total ?? 0;

  return {
    trend,
    total_expense_today: totalExpenseToday,
    daily_limit: dailyLimit,
    percentage_expense_today: dailyLimit > 0 ? (totalExpenseToday / dailyLimit) * 100 : 0,
    last_moves: lastExpenses.slice(0, 5),
  };
}

export const dashboardService = {
  /**
   * Returns the dashboard data for the authenticated user. Falls back to a
   * locally-computed approximation (see {@link computeLocalDashboard}) when
   * offline or the API is unreachable.
   */
  async getAll(): Promise<DashboardType> {
    if (isOnline()) {
      try {
        const { data } = await apiClient.get<DashboardType>('/dashboard');
        recordApiOutcome(true);
        return data;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }
    return computeLocalDashboard();
  },
};
