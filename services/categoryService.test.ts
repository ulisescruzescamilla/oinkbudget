import apiClient from '@/api/client';
import * as categoryRepository from '@/database/categoryRepository';
import { isOnline } from '@/utils/networkStatus';
import { categoryService } from './categoryService';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/database/categoryRepository');
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
}));

const payload = { name: 'Mascotas', color: '#1289E7', icon_code: 'paw', type: 'expense' as const };

describe('categoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isOnline as jest.Mock).mockReturnValue(true);
  });

  it('creates a category, maps its id and caches it', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: '9', ...payload } });

    const result = await categoryService.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/categories', payload);
    expect(result).toEqual({ id: 9, ...payload });
    expect(categoryRepository.upsertFromServer).toHaveBeenCalledWith(result);
  });

  it('updates a category and refreshes its cached copy', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: '9', ...payload } });

    const result = await categoryService.update(9, payload);

    expect(apiClient.put).toHaveBeenCalledWith('/categories/9', payload);
    expect(categoryRepository.upsertFromServer).toHaveBeenCalledWith(result);
  });

  it('deletes a category and drops it from the cache', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({});

    await categoryService.remove(9);

    expect(apiClient.delete).toHaveBeenCalledWith('/categories/9');
    expect(categoryRepository.remove).toHaveBeenCalledWith(9);
  });

  it('rejects mutations while offline without calling the API', async () => {
    (isOnline as jest.Mock).mockReturnValue(false);

    await expect(categoryService.create(payload)).rejects.toMatchObject({
      message: 'Se requiere conexión a internet para modificar categorías',
    });
    await expect(categoryService.remove(9)).rejects.toBeTruthy();
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  it('falls back to the cache when offline on getAll', async () => {
    (isOnline as jest.Mock).mockReturnValue(false);
    (categoryRepository.getAll as jest.Mock).mockResolvedValue([{ id: 1, ...payload }]);

    await expect(categoryService.getAll()).resolves.toEqual([{ id: 1, ...payload }]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
