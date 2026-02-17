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
