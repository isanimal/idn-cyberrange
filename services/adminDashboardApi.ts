import { AdminDashboardOverview } from '../types';
import { apiClient } from './apiClient';

export const adminDashboardApi = {
  overview: (): Promise<AdminDashboardOverview> =>
    apiClient.get<AdminDashboardOverview>('/api/v1/admin/dashboard/overview'),
};

