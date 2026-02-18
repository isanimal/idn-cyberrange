import { LessonDetail, ModuleDetail, ModuleSummary } from '../types';
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

  getModuleLabs: async (slug: string): Promise<ModuleDetail['labs']> => {
    const response = await apiClient.get<{ data: { labs: ModuleDetail['labs'] } }>(`/api/v1/modules/${slug}/labs`);
    return response.data.labs;
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

  getLesson: async (slug: string, lessonId: string): Promise<LessonDetail> => {
    const response = await apiClient.get<{ data: LessonDetail }>(`/api/v1/modules/${slug}/lessons/${lessonId}`);
    return response.data;
  },

  getLessonById: async (lessonId: string): Promise<LessonDetail> => {
    const response = await apiClient.get<{ data: LessonDetail }>(`/api/v1/lessons/${lessonId}`);
    return response.data;
  },

  updateLessonProgress: (
    lessonId: string,
    payload: { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; percent?: number },
  ): Promise<{ data: { module_progress_percent: number } }> =>
    apiClient.post<{ data: { module_progress_percent: number } }>(`/api/v1/lessons/${lessonId}/progress`, payload),

  completeLessonById: (
    lessonId: string,
  ): Promise<{ data: { module_id: string; lesson_id: string; progress_percent: number } }> =>
    apiClient.post<{ data: { module_id: string; lesson_id: string; progress_percent: number } }>(
      `/api/v1/lessons/${lessonId}/complete`,
    ),

  readingEvent: (
    lessonId: string,
    payload: { event: 'OPEN' | 'SCROLL' | 'HEARTBEAT'; percentViewed?: number },
  ): Promise<{ data: { lesson_id: string; status: string; percent: number; module_progress_percent: number } }> =>
    apiClient.post<{ data: { lesson_id: string; status: string; percent: number; module_progress_percent: number } }>(
      `/api/v1/lessons/${lessonId}/reading-event`,
      payload,
    ),

  toggleTask: (
    taskId: string,
  ): Promise<{ data: { task_id: string; is_done: boolean; lesson_percent: number; module_progress_percent: number } }> =>
    apiClient.post<{ data: { task_id: string; is_done: boolean; lesson_percent: number; module_progress_percent: number } }>(
      `/api/v1/tasks/${taskId}/toggle`,
    ),

  list: async (): Promise<ModuleSummary[]> => modulesApi.listModules(),
  detail: (slug: string): Promise<ModuleDetail> => modulesApi.getModule(slug),
};
