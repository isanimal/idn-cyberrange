import { AdminAssignedModuleItem, AdminUserModuleOption } from '../types';
import { apiClient } from './apiClient';

interface AdminUserModulesResponse {
  data: {
    assigned: AdminAssignedModuleItem[];
    available: AdminUserModuleOption[];
  };
}

export const adminUserModulesApi = {
  list: async (userId: string): Promise<{ assigned: AdminAssignedModuleItem[]; available: AdminUserModuleOption[] }> => {
    const response = await apiClient.get<AdminUserModulesResponse>(`/api/v1/admin/users/${userId}/modules`);
    return response.data;
  },
  assign: async (
    userId: string,
    moduleIds: string[],
    status: 'ASSIGNED' | 'ACTIVE' | 'LOCKED' = 'ASSIGNED',
  ): Promise<{ assigned: AdminAssignedModuleItem[]; available: AdminUserModuleOption[] }> => {
    const response = await apiClient.post<AdminUserModulesResponse>(`/api/v1/admin/users/${userId}/modules`, {
      module_ids: moduleIds,
      status,
    });
    return response.data;
  },
  unassign: async (userId: string, moduleId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/users/${userId}/modules/${moduleId}`);
  },
};
