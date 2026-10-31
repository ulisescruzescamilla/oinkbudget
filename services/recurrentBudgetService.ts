import apiClient from '@/api/client';
import { RecurrentBudgetType } from '@/types/RecurrentBudgetType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';

/** Raw API shape — id is a string. */
type ApiRecurrentBudget = Omit<RecurrentBudgetType, 'id'> & { id: string };

/** Fields required to create or update a recurrent budget. */
export type RecurrentBudgetPayload = Omit<RecurrentBudgetType, 'id'>;

const toRecurrentBudgetType = (r: ApiRecurrentBudget): RecurrentBudgetType => ({ ...r, id: Number(r.id) });

/**
 * Rejects when the device is offline. Recurrent budgets have no local cache
 * or offline queue, so every call needs the API.
 */
function requireOnline(): void {
  if (!isOnline()) {
    throw { message: 'Se requiere conexión a internet para ver y modificar presupuestos recurrentes' } as AppError;
  }
}

export const recurrentBudgetService = {
  /** Returns all recurrent budgets. Requires connectivity. */
  async getAll(): Promise<RecurrentBudgetType[]> {
    requireOnline();
    try {
      const { data } = await apiClient.get<ApiRecurrentBudget[]>('/recurrent-budgets');
      recordApiOutcome(true);
      return data.map(toRecurrentBudgetType);
    } catch (err) {
      if (isNetworkError(err as AppError)) recordApiOutcome(false);
      throw err;
    }
  },

  /**
   * Creates a recurrent budget. Requires connectivity. A 422 surfaces field
   * errors keyed `name`, `color` and `icon_code`.
   *
   * @param payload - Recurrent budget data to create
   */
  async create(payload: RecurrentBudgetPayload): Promise<RecurrentBudgetType> {
    requireOnline();
    const { data } = await apiClient.post<ApiRecurrentBudget>('/recurrent-budgets', payload);
    return toRecurrentBudgetType(data);
  },

  /**
   * Updates a recurrent budget. Requires connectivity.
   *
   * @param id - Recurrent budget identifier
   * @param payload - Fields to update
   */
  async update(id: number, payload: Partial<RecurrentBudgetPayload>): Promise<RecurrentBudgetType> {
    requireOnline();
    const { data } = await apiClient.put<ApiRecurrentBudget>(`/recurrent-budgets/${id}`, payload);
    return toRecurrentBudgetType(data);
  },

  /**
   * Deletes a recurrent budget. Requires connectivity.
   *
   * @param id - Recurrent budget identifier
   */
  async remove(id: number): Promise<void> {
    requireOnline();
    await apiClient.delete(`/recurrent-budgets/${id}`);
  },
};
