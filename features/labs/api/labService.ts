import { apiClient } from '../../../services/apiClient';
import { DeleteLabResponse, LabDetailResponse, LabInstance, LabTemplate } from '../types';

interface ListLabsResponse {
  data: LabTemplate[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface InstanceListResponse {
  data: LabInstance[];
}

const unwrapInstance = (payload: unknown): LabInstance => {
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: LabInstance } & LabInstance;
    if (obj.data) {
      return obj.data;
    }
    return obj;
  }

  throw new Error('Invalid lab instance response');
};

export const labService = {
  // --- PUBLIC / USER METHODS ---

  getLabs: async (filters?: Record<string, string | number | undefined>): Promise<LabTemplate[]> => {
    const query = new URLSearchParams();
    if (filters?.search) query.set('search', String(filters.search));
    if (filters?.difficulty) query.set('difficulty', String(filters.difficulty));
    if (filters?.category) query.set('category', String(filters.category));
    const suffix = query.toString() ? `?${query.toString()}` : '';

    const response = await apiClient.get<ListLabsResponse>(`/api/v1/labs${suffix}`);
    return response.data;
  },

  getLabDetail: async (id: string): Promise<LabDetailResponse> =>
    apiClient.get<LabDetailResponse>(`/api/v1/labs/${id}`),

  activateLab: async (labTemplateId: string, moduleId?: string): Promise<LabInstance> => {
    const response = await apiClient.post<LabInstance | { data: LabInstance }>('/api/v1/lab-instances', {
      lab_template_id: labTemplateId,
      ...(moduleId ? { module_id: moduleId } : {}),
    });

    return unwrapInstance(response);
  },

  deactivateLab: async (instanceId: string): Promise<LabInstance> => {
    const response = await apiClient.post<LabInstance | { data: LabInstance }>(`/api/v1/lab-instances/${instanceId}/stop`);
    return unwrapInstance(response);
  },

  restartLab: async (instanceId: string): Promise<LabInstance> => {
    const response = await apiClient.post<LabInstance | { data: LabInstance }>(`/api/v1/lab-instances/${instanceId}/restart`);
    return unwrapInstance(response);
  },

  getInstance: async (instanceId: string): Promise<LabInstance> => {
    const response = await apiClient.get<{ data: LabInstance }>(`/api/v1/labs/instances/${instanceId}`);
    return response.data;
  },

  myInstances: async (): Promise<LabInstance[]> => {
    const response = await apiClient.get<InstanceListResponse>('/api/v1/labs/instances/my');
    return response.data;
  },

  updateInstance: async (instanceId: string, data: Partial<LabInstance>): Promise<LabInstance> => {
    const response = await apiClient.patch<LabInstance | { data: LabInstance }>(`/api/v1/lab-instances/${instanceId}`, data);
    return unwrapInstance(response);
  },

  // --- ADMIN METHODS ---

  getAllLabsAdmin: async (): Promise<LabTemplate[]> => {
    const response = await apiClient.get<{ data: LabTemplate[] }>('/api/v1/admin/labs?per_page=100');
    return response.data;
  },

  createLab: async (data: Partial<LabTemplate>): Promise<LabTemplate> => {
    return apiClient.post<LabTemplate>('/api/v1/admin/labs', toAdminLabPayload(data));
  },

  updateLab: async (id: string, data: Partial<LabTemplate>): Promise<LabTemplate> => {
    return apiClient.patch<LabTemplate>(`/api/v1/admin/labs/${id}`, toAdminLabPayload(data));
  },

  publishLab: async (id: string, version: string, notes: string): Promise<LabTemplate> => {
    return apiClient.post<LabTemplate>(`/api/v1/admin/labs/${id}/publish`, { version, notes });
  },

  archiveLab: async (id: string): Promise<void> => {
    await apiClient.post<LabTemplate>(`/api/v1/admin/labs/${id}/archive`);
  },

  deleteLab: async (id: string): Promise<DeleteLabResponse> => {
    return apiClient.delete<DeleteLabResponse>(`/api/v1/admin/labs/${id}`);
  },
};

const PORT_PLACEHOLDER = '${PORT}';
const DEFAULT_COMPOSE = `services:\n  app:\n    image: nginx:alpine\n    ports:\n      - "${PORT_PLACEHOLDER}:80"\n`;

const toAdminLabPayload = (data: Partial<LabTemplate>): Record<string, unknown> => {
  const internalPort = data.configuration?.base_port ?? data.internal_port ?? 80;
  const composeYaml = data.configuration?.content ?? data.docker_compose_yaml ?? DEFAULT_COMPOSE;

  return {
    title: data.title,
    slug: data.slug,
    difficulty: data.difficulty,
    category: data.category,
    est_minutes: data.estimated_time_minutes,
    estimated_time_minutes: data.estimated_time_minutes,
    short_description: data.short_description,
    guide_markdown: data.long_description,
    long_description: data.long_description,
    tags: data.tags ?? [],
    objectives: data.objectives ?? [],
    prerequisites: data.prerequisites ?? [],
    version: data.version,
    internal_port: internalPort,
    docker_compose_yaml: composeYaml,
    configuration: {
      type: 'docker-compose',
      content: composeYaml,
      base_port: internalPort,
    },
  };
};
