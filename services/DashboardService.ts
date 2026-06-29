import apiClient from "@/api/client";
import { DashboardType } from "@/types/DashboardType";

export const dashboardService = {
  /**
   * Returns the dashboard data for the authenticated user.
   */
  async getAll(): Promise<DashboardType | any> {
    const { data } = await apiClient.get<DashboardType>('/dashboard');
    return data;
  },
};
