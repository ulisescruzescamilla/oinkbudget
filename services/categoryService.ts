import apiClient from '@/api/client';
import { CategoryType } from '@/types/CategoryType';

/** Raw API shape — id is a string. */
type ApiCategory = Omit<CategoryType, 'id'> & { id: string };

const toCategoryType = (c: ApiCategory): CategoryType => ({ ...c, id: Number(c.id) });

export const categoryService = {
  async getAll(): Promise<CategoryType[]> {
    const { data } = await apiClient.get<ApiCategory[]>('/categories');
    return data.map(toCategoryType);
  },
};
