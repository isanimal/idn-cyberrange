import { AdminLesson, AdminModule, AdminModuleLevel, AdminModuleStatus } from '../types';
import { apiClient } from './apiClient';

interface AdminModulesListResponse {
  data: AdminModule[];
}

interface AdminLessonsListResponse {
  data: AdminLesson[];
}

export interface CreateAdminModulePayload {
  title: string;
  slug: string;
  description: string;
  level: AdminModuleLevel;
  status: AdminModuleStatus;
  order_index: number;
}

export interface UpdateAdminModulePayload {
  title?: string;
  slug?: string;
  description?: string;
  level?: AdminModuleLevel;
  status?: AdminModuleStatus;
  order_index?: number;
}

export interface CreateAdminLessonPayload {
  title: string;
  content: string;
  order_index: number;
}

export interface UpdateAdminLessonPayload {
  title?: string;
  content?: string;
  order_index?: number;
}

export const adminModulesApi = {
  list: async (): Promise<AdminModule[]> => {
    const response = await apiClient.get<AdminModulesListResponse>('/api/v1/admin/modules');
    return response.data;
  },

  create: (payload: CreateAdminModulePayload): Promise<AdminModule> =>
    apiClient.post<AdminModule>('/api/v1/admin/modules', payload),

  update: (id: string, payload: UpdateAdminModulePayload): Promise<AdminModule> =>
    apiClient.patch<AdminModule>(`/api/v1/admin/modules/${id}`, payload),

  remove: (id: string): Promise<void> =>
    apiClient.delete<void>(`/api/v1/admin/modules/${id}`),

  listLessons: async (moduleId: string): Promise<AdminLesson[]> => {
    const response = await apiClient.get<AdminLessonsListResponse>(`/api/v1/admin/modules/${moduleId}/lessons`);
    return response.data;
  },

  createLesson: (moduleId: string, payload: CreateAdminLessonPayload): Promise<AdminLesson> =>
    apiClient.post<AdminLesson>(`/api/v1/admin/modules/${moduleId}/lessons`, payload),

  updateLesson: (moduleId: string, lessonId: string, payload: UpdateAdminLessonPayload): Promise<AdminLesson> =>
    apiClient.patch<AdminLesson>(`/api/v1/admin/modules/${moduleId}/lessons/${lessonId}`, payload),

  removeLesson: (moduleId: string, lessonId: string): Promise<void> =>
    apiClient.delete<void>(`/api/v1/admin/modules/${moduleId}/lessons/${lessonId}`),
};

