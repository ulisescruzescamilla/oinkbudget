import apiClient from '@/api/client';
import { BudgetType } from '@/types/BudgetType';
import { CategoryType } from '@/types/CategoryType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { formatApiDate, parseApiDate } from '@/utils/formatting';
import * as budgetRepository from '@/database/budgetRepository';
import type { ApiEntitySource } from './offline/DataSource';
import { SyncingDataSource } from './offline/SyncingDataSource';

/** Raw embedded category shape from the API (id as string). */
type ApiCategory = Omit<CategoryType, 'id'> & { id: string };

/** Raw shape returned by the API (id is a string, dates are Y-m-d strings). */
type ApiBudget = Omit<BudgetType, 'id' | 'start_date' | 'end_date' | 'category'> & {
  id: string;
  start_date?: string;
  end_date?: string;
  category?: ApiCategory;
};

/** Fields required to create or update a budget. Send either max_limit or percentage_value, not both. */
export type BudgetPayload = Pick<BudgetType, 'name' | 'is_recurrent' | 'period'> & {
  max_limit?: number;
  percentage_value?: number;
  expense_amount?: number;
  start_date?: Date;
  end_date?: Date;
  category_id?: number | null;
};

const toBudgetType = (b: ApiBudget): BudgetType => ({
  ...b,
  id: Number(b.id),
  start_date: parseApiDate(b.start_date),
  end_date: parseApiDate(b.end_date),
  category: b.category ? { ...b.category, id: Number(b.category.id) } : undefined,
});

const apiSource: ApiEntitySource<BudgetType, BudgetPayload> = {
  async getAll() {
    const { data } = await apiClient.get<ApiBudget[]>('/budgets');
    return data.map(toBudgetType);
  },
  async create(payload) {
    const { data } = await apiClient.post<ApiBudget>('/budgets', {
      ...payload,
      start_date: formatApiDate(payload.start_date),
      end_date: formatApiDate(payload.end_date),
    });
    return toBudgetType(data);
  },
  async update(id, payload) {
    const { data } = await apiClient.put<ApiBudget>(`/budgets/${id}`, {
      ...payload,
      start_date: formatApiDate(payload.start_date),
      end_date: formatApiDate(payload.end_date),
    });
    return toBudgetType(data);
  },
  async remove(id) {
    await apiClient.delete(`/budgets/${id}`);
  },
};

const synced = new SyncingDataSource(apiSource, budgetRepository, 'budget');

export const budgetService = {
  /**
   * Returns all budgets for the authenticated user. Falls back to the local
   * mirror when offline or the API is unreachable.
   */
  getAll: (): Promise<BudgetType[]> => synced.getAll(),

  /**
   * Returns a single budget by id, falling back to the local mirror on a network error.
   *
   * @param id - Budget identifier
   */
  async getById(id: string): Promise<BudgetType> {
    try {
      const { data } = await apiClient.get<ApiBudget>(`/budgets/${id}`);
      return toBudgetType(data);
    } catch (err) {
      if (!isNetworkError(err as AppError)) throw err;
      const local = await budgetRepository.findById(Number(id));
      if (local) return local;
      throw err;
    }
  },

  /**
   * Creates a new budget. Queued locally for sync when offline. The server
   * calculates max_limit from the user's income when online.
   *
   * @param payload - Budget data to create
   */
  create: (payload: BudgetPayload): Promise<BudgetType> => synced.create(payload),

  /**
   * Updates an existing budget. `id` may be a server id or, for a record
   * that hasn't synced yet, its local `client_id`.
   *
   * @param id - Budget identifier
   * @param payload - Fields to update
   */
  update: (id: string, payload: Partial<BudgetPayload>): Promise<BudgetType> => synced.update(id, payload),

  /**
   * Deletes a budget and its associated expenses.
   *
   * @param id - Budget identifier
   */
  remove: (id: string): Promise<void> => synced.remove(id),
};
