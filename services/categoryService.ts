import apiClient from '@/api/client';
import { CategoryType } from '@/types/CategoryType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import * as categoryRepository from '@/database/categoryRepository';

/** Raw API shape — id is a string. */
type ApiCategory = Omit<CategoryType, 'id'> & { id: string };

/** Fields required to create or update a category. */
export type CategoryPayload = Omit<CategoryType, 'id'>;

const toCategoryType = (c: ApiCategory): CategoryType => ({ ...c, id: Number(c.id) });

/**
 * Rejects when the device is offline. Category mutations have no offline
 * queue — budgets reference categories by server id, so a category must exist
 * on the server before anything can use it.
 */
function requireOnline(): void {
  if (!isOnline()) {
    throw { message: 'Se requiere conexión a internet para modificar categorías' } as AppError;
  }
}

export const categoryService = {
  /**
   * Returns all categories. Falls back to the local read-through cache when
   * offline or the API is unreachable.
   */
  async getAll(): Promise<CategoryType[]> {
    if (isOnline()) {
      try {
        const { data } = await apiClient.get<ApiCategory[]>('/categories');
        recordApiOutcome(true);
        const categories = data.map(toCategoryType);
        await categoryRepository.replaceAllFromServer(categories);
        return categories;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }
    return categoryRepository.getAll();
  },

  /**
   * Creates a category and caches it locally. Requires connectivity. A 422
   * surfaces field errors keyed `name`, `color`, `icon_code` and `type`.
   *
   * @param payload - Category data to create
   */
  async create(payload: CategoryPayload): Promise<CategoryType> {
    requireOnline();
    const { data } = await apiClient.post<ApiCategory>('/categories', payload);
    const created = toCategoryType(data);
    await categoryRepository.upsertFromServer(created);
    return created;
  },

  /**
   * Updates a category and refreshes its cached copy. Requires connectivity.
   *
   * @param id - Category identifier
   * @param payload - Fields to update
   */
  async update(id: number, payload: Partial<CategoryPayload>): Promise<CategoryType> {
    requireOnline();
    const { data } = await apiClient.put<ApiCategory>(`/categories/${id}`, payload);
    const updated = toCategoryType(data);
    await categoryRepository.upsertFromServer(updated);
    return updated;
  },

  /**
   * Deletes a category and drops it from the local cache. Requires connectivity.
   *
   * @param id - Category identifier
   */
  async remove(id: number): Promise<void> {
    requireOnline();
    await apiClient.delete(`/categories/${id}`);
    await categoryRepository.remove(id);
  },
};
