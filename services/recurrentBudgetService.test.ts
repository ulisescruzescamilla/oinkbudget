import apiClient from '@/api/client';
import { isOnline } from '@/utils/networkStatus';
import { recurrentBudgetService } from './recurrentBudgetService';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/utils/networkStatus', () => ({
  isOnline: jest.fn(),
  recordApiOutcome: jest.fn(),
}));

const payload = { name: 'Renta', color: '#1289E7', icon_code: 'house' };

describe('recurrentBudgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isOnline as jest.Mock).mockReturnValue(true);
  });

  it('lists recurrent budgets from /recurrent-budgets and maps their ids', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [{ id: '3', ...payload }] });

    const result = await recurrentBudgetService.getAll();

    expect(apiClient.get).toHaveBeenCalledWith('/recurrent-budgets');
    expect(result).toEqual([{ id: 3, ...payload }]);
  });

  it('creates a recurrent budget', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: '9', ...payload } });

    const result = await recurrentBudgetService.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/recurrent-budgets', payload);
    expect(result).toEqual({ id: 9, ...payload });
  });

  it('updates a recurrent budget', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: '9', ...payload } });

    await recurrentBudgetService.update(9, payload);

    expect(apiClient.put).toHaveBeenCalledWith('/recurrent-budgets/9', payload);
  });

  it('deletes a recurrent budget', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({});

    await recurrentBudgetService.remove(9);

    expect(apiClient.delete).toHaveBeenCalledWith('/recurrent-budgets/9');
  });

  it('rejects every call while offline without hitting the API', async () => {
    (isOnline as jest.Mock).mockReturnValue(false);

    await expect(recurrentBudgetService.getAll()).rejects.toMatchObject({ message: expect.any(String) });
    await expect(recurrentBudgetService.create(payload)).rejects.toMatchObject({ message: expect.any(String) });
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
