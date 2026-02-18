import { DashboardData } from '../types';
import { apiClient } from './apiClient';

export const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const response = await apiClient.get<{ data: DashboardData }>('/api/v1/dashboard');
    return response.data;
  },
};
