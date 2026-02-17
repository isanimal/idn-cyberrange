import { AdminOverviewData, AdminOverviewResponse } from '../types';
import { apiClient } from './apiClient';

export const adminDashboardApi = {
  overview: async (): Promise<AdminOverviewData> => {
    const response = await apiClient.get<AdminOverviewResponse>('/api/v1/admin/overview');
    return response.data;
  },
};
