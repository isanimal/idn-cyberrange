import { ModuleDetail, ModuleSummary } from '../types';
import { apiClient } from './apiClient';

export const modulesApi = {
  listModules: async (): Promise<ModuleSummary[]> => {
    const response = await apiClient.get<{ data: ModuleSummary[] }>('/api/v1/modules');
    return response.data;
  },

  getModule: async (slug: string): Promise<ModuleDetail> => {
    const response = await apiClient.get<ModuleDetail & { data?: ModuleDetail }>(`/api/v1/modules/${slug}`);
    return response.data ?? response;
  },

  startModule: (slug: string): Promise<{ data: { module_id: string; progress_percent: number } }> =>
    apiClient.post<{ data: { module_id: string; progress_percent: number } }>(`/api/v1/modules/${slug}/start`),

  completeLesson: (
    slug: string,
    lessonId: string,
  ): Promise<{ data: { module_id: string; lesson_id: string; progress_percent: number } }> =>
    apiClient.post<{ data: { module_id: string; lesson_id: string; progress_percent: number } }>(
      `/api/v1/modules/${slug}/lessons/${lessonId}/complete`,
    ),

  list: async (): Promise<ModuleSummary[]> => modulesApi.listModules(),
  detail: (slug: string): Promise<ModuleDetail> => modulesApi.getModule(slug),
};
