import apiClient from '@/api/client';
import { BudgetType } from '@/types/BudgetType';
import { formatApiDate } from '@/utils/formatting';

/** Raw shape returned by the API (id is a string, dates are Y-m-d strings). */
type ApiBudget = Omit<BudgetType, 'id' | 'start_date' | 'end_date'> & {
  id: string;
  start_date?: string;
  end_date?: string;
};

/** Fields required to create or update a budget. Send either max_limit or percentage_value, not both. */
export type BudgetPayload = Pick<BudgetType, 'name' > & {
  max_limit?: number;
  percentage_value?: number;
  start_date?: Date;
  end_date?: Date;
  graph_color: string;
};

/**
 * Parses a Y-m-d date string from the API into a local Date object.
 * Appends T00:00:00 to avoid timezone shifts when parsing date-only strings.
 * Returns undefined if the value is absent.
 *
 * @param value - Date string in Y-m-d format (e.g. "2024-01-15")
 */
const parseApiDate = (value?: string): Date | undefined =>
  value ? new Date(`${value}T00:00:00`) : undefined;

const toBudgetType = (b: ApiBudget): BudgetType => ({
  ...b,
  id: Number(b.id),
  start_date: parseApiDate(b.start_date),
  end_date: parseApiDate(b.end_date),
});

export const budgetService = {
  /**
   * Returns all budgets for the authenticated user.
   */
  async getAll(): Promise<BudgetType[]> {
    const { data } = await apiClient.get<ApiBudget[]>('/budgets');
    return data.map(toBudgetType);
  },

  /**
   * Returns a single budget by id.
   *
   * @param id - Budget identifier
   */
  async getById(id: string): Promise<BudgetType> {
    const { data } = await apiClient.get<ApiBudget>(`/budgets/${id}`);
    return toBudgetType(data);
  },

  /**
   * Creates a new budget. The server calculates max_limit from the user's income.
   *
   * @param payload - Budget data to create
   */
  async create(payload: BudgetPayload): Promise<BudgetType> {
    const { data } = await apiClient.post<ApiBudget>('/budgets', {
      ...payload,
      start_date: formatApiDate(payload.start_date),
      end_date: formatApiDate(payload.end_date),
    });
    return toBudgetType(data);
  },

  /**
   * Updates an existing budget.
   *
   * @param id - Budget identifier
   * @param payload - Fields to update
   */
  async update(id: string, payload: Partial<BudgetPayload>): Promise<BudgetType> {
    const { data } = await apiClient.put<ApiBudget>(`/budgets/${id}`, {
      ...payload,
      start_date: formatApiDate(payload.start_date),
      end_date: formatApiDate(payload.end_date),
    });
    return toBudgetType(data);
  },

  /**
   * Deletes a budget and its associated expenses.
   *
   * @param id - Budget identifier
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/budgets/${id}`);
  },
};
