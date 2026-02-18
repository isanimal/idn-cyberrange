export enum LabDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum LabStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum InstanceState {
  INACTIVE = 'INACTIVE', // Not started yet
  ACTIVE = 'ACTIVE',     // Running/Provisioned
  PAUSED = 'PAUSED',     // Stopped but state preserved
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

export interface LabAsset {
  type: 'file' | 'link' | 'vm_profile';
  name: string;
  url: string;
}

export interface LabChangelog {
  version: string;
  date: string;
  notes: string;
}

export interface LabConfiguration {
  type: 'docker-compose' | 'dockerfile';
  content: string; // The YAML or Dockerfile string
  base_port: number; // The internal port (e.g., 80)
}

export interface LabTemplate {
  id: string;
  slug: string;
  title: string;
  difficulty: LabDifficulty;
  category: string;
  short_description: string;
  long_description: string; // Markdown
  prerequisites: string[];
  estimated_time_minutes: number;
  objectives: string[];
  tags: string[];
  version: string; 
  status: LabStatus;
  assets?: LabAsset[];
  changelog?: LabChangelog[];
  configuration?: LabConfiguration; // NEW: Stores the docker definition
  internal_port?: number;
  docker_compose_yaml?: string;
  guide_markdown?: string;
  created_at: string;
  updated_at: string;
}

export interface LabInstance {
  instance_id: string;
  user_id: string;
  module_id?: string | null;
  lab_template_id: string;
  template_version_pinned: string;
  state: InstanceState;
  progress_percent: number;
  started_at: string;
  last_activity_at: string;
  completed_at?: string;
  attempts_count: number;
  notes: string;
  score?: number;
  expires_at?: string;
  assigned_port?: number; // NEW: The specific external port assigned to this user
  connection_url?: string;
  status?: string;
  ip_address?: string | null;
  exposed_ports?: Array<{ internal: number; external: number }>;
  gateway?: string | null;
  max_ttl?: number | null;
  resources?: {
    cpu: number | null;
    memory_mb: number | null;
  };
  access_urls?: Array<{ label: string; url: string }>;
  runtime_metadata?: Record<string, unknown>;
  last_error?: string | null;
}

export interface LabDetailResponse extends LabTemplate {
  user_instance: LabInstance | null;
}
