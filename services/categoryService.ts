import apiClient from '@/api/client';
import { CategoryType } from '@/types/CategoryType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import * as categoryRepository from '@/database/categoryRepository';

/** Raw API shape — id is a string. */
type ApiCategory = Omit<CategoryType, 'id'> & { id: string };

const toCategoryType = (c: ApiCategory): CategoryType => ({ ...c, id: Number(c.id) });

export const categoryService = {
  /**
   * Returns all categories. Falls back to the local read-through cache when
   * offline — categories aren't created or edited from this app, so there's
   * no offline mutation path to support.
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
};
