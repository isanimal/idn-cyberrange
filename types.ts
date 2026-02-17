export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
  points: number;
  completedModules: number;
  rank: string;
  avatarUrl?: string;
}

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: 'Basic' | 'Intermediate' | 'Advanced';
  order: number;
  progress: number; // 0-100
  isLocked: boolean;
  tags: string[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  contentMd: string;
  estimatedTime: string;
}

export interface Lab {
  id: string;
  moduleId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'docker';
  status: 'STOPPED' | 'STARTING' | 'RUNNING';
  containerId?: string;
  endpoint?: string;
  expiresAt?: Date;
}

export interface Challenge {
  id: string;
  labId: string;
  title: string;
  description: string;
  points: number;
  solved: boolean;
  flagFormatHint: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  value: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface Cheatsheet {
  id: string;
  title: string;
  category: string;
  content: string; // Markdown
}

export interface StatPoint {
  name: string;
  value: number;
}

export type UserModuleLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
export type UserModuleStatus = 'ACTIVE' | 'LOCKED' | 'DRAFT' | 'ARCHIVED';

export interface ModuleSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level?: UserModuleLevel;
  difficulty: UserModuleLevel;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  category?: string;
  est_minutes?: number;
  version?: string;
  tags: string[];
  cover_icon?: string | null;
  order_index: number;
  lessons_count: number;
  progress_percent: number;
  is_locked: boolean;
  completed_at?: string | null;
}

export interface LessonSummary {
  id: string;
  title: string;
  content_md?: string | null;
  order: number;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface ModuleLabSummary {
  lab_template_id: string;
  title: string;
  difficulty: string;
  est_minutes: number;
  type: 'LAB' | 'CHALLENGE';
  required: boolean;
  status_for_user: 'NOT_STARTED' | 'RUNNING' | 'STOPPED';
  instance_id?: string | null;
}

export interface ModuleDetail extends ModuleSummary {
  lessons: LessonSummary[];
  labs?: ModuleLabSummary[];
}

export type UserModuleCardDTO = ModuleSummary;
export type UserModuleLessonDTO = LessonSummary;
export type UserModuleDetailDTO = ModuleDetail;

export type AdminModuleLevel = 'basic' | 'intermediate' | 'advanced';
export type AdminModuleStatus = 'active' | 'locked' | 'draft';

export interface AdminModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: AdminModuleLevel;
  status: AdminModuleStatus;
  order_index: number;
  lessons_count: number;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminLesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminOverviewTotals {
  users: number;
  active_lab_instances: number;
  submissions_24h: number;
  failed_jobs: number;
}

export interface AdminOverviewSubmissionPoint {
  date: string;
  day: string;
  count: number;
}

export interface AdminOverviewAuditLog {
  id: string | number;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_label: string;
  created_at: string | null;
  created_at_human: string | null;
}

export interface AdminOverviewData {
  totals: AdminOverviewTotals;
  submissions_last_7_days: AdminOverviewSubmissionPoint[];
  recent_audit_logs: AdminOverviewAuditLog[];
}

export interface AdminOverviewResponse {
  data: AdminOverviewData;
}
