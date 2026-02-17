import { UserModuleCardDTO, UserModuleDetailDTO } from '../types';
import { apiClient } from './apiClient';

export const modulesApi = {
  list: async (): Promise<UserModuleCardDTO[]> => {
    const response = await apiClient.get<{ data: UserModuleCardDTO[] }>('/api/v1/modules');
    return response.data;
  },

  detail: (slug: string): Promise<UserModuleDetailDTO> =>
    apiClient.get<UserModuleDetailDTO>(`/api/v1/modules/${slug}`),
};

