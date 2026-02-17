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

export interface AdminLessonTaskPayload {
  title: string;
  order_index: number;
  points?: number;
}

export interface AdminLessonAssetPayload {
  type?: 'IMAGE';
  url: string;
  caption?: string;
  order_index: number;
}

const toDifficulty = (level: AdminModuleLevel): 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' =>
  level === 'basic' ? 'BASIC' : level === 'intermediate' ? 'INTERMEDIATE' : 'ADVANCED';

const toApiStatus = (status: AdminModuleStatus): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' =>
  status === 'draft' ? 'DRAFT' : status === 'active' ? 'PUBLISHED' : 'ARCHIVED';

const fromApiLevel = (value: string): AdminModuleLevel => {
  const upper = value.toUpperCase();
  if (upper === 'INTERMEDIATE') return 'intermediate';
  if (upper === 'ADVANCED') return 'advanced';
  return 'basic';
};

const fromApiStatus = (value: string): AdminModuleStatus => {
  const upper = value.toUpperCase();
  if (upper === 'PUBLISHED' || upper === 'ACTIVE') return 'active';
  if (upper === 'DRAFT') return 'draft';
  return 'locked';
};

const normalizeModule = (module: AdminModule): AdminModule => ({
  ...module,
  level: fromApiLevel((module as unknown as { level?: string; difficulty?: string }).level ?? (module as unknown as { difficulty?: string }).difficulty ?? 'BASIC'),
  status: fromApiStatus((module as unknown as { status?: string }).status ?? 'DRAFT'),
});

const normalizeLesson = (lesson: AdminLesson): AdminLesson => ({
  ...lesson,
  content: (lesson as unknown as { content?: string; content_md?: string }).content ?? (lesson as unknown as { content_md?: string }).content_md ?? '',
});

export const adminModulesApi = {
  list: async (): Promise<AdminModule[]> => {
    const response = await apiClient.get<AdminModulesListResponse>('/api/v1/admin/modules');
    return response.data.map(normalizeModule);
  },

  create: async (payload: CreateAdminModulePayload): Promise<AdminModule> => {
    const response = await apiClient.post<AdminModule>('/api/v1/admin/modules', {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      difficulty: toDifficulty(payload.level),
      status: toApiStatus(payload.status),
      order_index: payload.order_index,
    });
    return normalizeModule(response);
  },

  update: async (id: string, payload: UpdateAdminModulePayload): Promise<AdminModule> => {
    const response = await apiClient.patch<AdminModule>(`/api/v1/admin/modules/${id}`, {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.level !== undefined ? { difficulty: toDifficulty(payload.level) } : {}),
      ...(payload.status !== undefined ? { status: toApiStatus(payload.status) } : {}),
      ...(payload.order_index !== undefined ? { order_index: payload.order_index } : {}),
    });
    return normalizeModule(response);
  },

  remove: (id: string): Promise<void> =>
    apiClient.delete<void>(`/api/v1/admin/modules/${id}`),

  listLessons: async (moduleId: string): Promise<AdminLesson[]> => {
    const response = await apiClient.get<AdminLessonsListResponse>(`/api/v1/admin/modules/${moduleId}/lessons`);
    return response.data.map(normalizeLesson);
  },

  getLesson: async (moduleId: string, lessonId: string): Promise<AdminLesson> => {
    const response = await apiClient.get<{ data: AdminLesson }>(`/api/v1/admin/modules/${moduleId}/lessons/${lessonId}`);
    return normalizeLesson(response.data);
  },

  createLesson: async (moduleId: string, payload: CreateAdminLessonPayload): Promise<AdminLesson> => {
    const response = await apiClient.post<AdminLesson>(`/api/v1/admin/modules/${moduleId}/lessons`, {
      title: payload.title,
      content_md: payload.content,
      order: payload.order_index,
    });
    return normalizeLesson(response);
  },

  updateLesson: async (moduleId: string, lessonId: string, payload: UpdateAdminLessonPayload): Promise<AdminLesson> => {
    const response = await apiClient.patch<AdminLesson>(`/api/v1/admin/modules/${moduleId}/lessons/${lessonId}`, {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.content !== undefined ? { content_md: payload.content } : {}),
      ...(payload.order_index !== undefined ? { order: payload.order_index } : {}),
    });
    return normalizeLesson(response);
  },

  removeLesson: (moduleId: string, lessonId: string): Promise<void> =>
    apiClient.delete<void>(`/api/v1/admin/modules/${moduleId}/lessons/${lessonId}`),

  createTask: (lessonId: string, payload: AdminLessonTaskPayload): Promise<{ data: { id: string } }> =>
    apiClient.post<{ data: { id: string } }>(`/api/v1/admin/lessons/${lessonId}/tasks`, payload),

  updateTask: (taskId: string, payload: Partial<AdminLessonTaskPayload>): Promise<{ data: { id: string } }> =>
    apiClient.patch<{ data: { id: string } }>(`/api/v1/admin/tasks/${taskId}`, payload),

  removeTask: (taskId: string): Promise<void> =>
    apiClient.delete<void>(`/api/v1/admin/tasks/${taskId}`),

  createAsset: (lessonId: string, payload: AdminLessonAssetPayload): Promise<{ data: { id: string } }> =>
    apiClient.post<{ data: { id: string } }>(`/api/v1/admin/lessons/${lessonId}/assets`, payload),

  updateAsset: (assetId: string, payload: Partial<AdminLessonAssetPayload>): Promise<{ data: { id: string } }> =>
    apiClient.patch<{ data: { id: string } }>(`/api/v1/admin/assets/${assetId}`, payload),

  removeAsset: (assetId: string): Promise<void> =>
    apiClient.delete<void>(`/api/v1/admin/assets/${assetId}`),
};
