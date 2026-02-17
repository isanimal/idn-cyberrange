import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { apiClient } from '../services/apiClient';

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  points?: number;
  completedModules?: number;
}

interface UsersPaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  registerUser: (newUser: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  getAllUsers: () => User[];
  fetchUsers: (page?: number, includeDeleted?: boolean) => Promise<{ data: User[]; meta: UsersPaginationMeta }>;
  suspendUser: (id: string) => Promise<void>;
  unsuspendUser: (id: string) => Promise<void>;
  resetUserAttempts: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  restoreUser: (id: string) => Promise<void>;
  refreshMe: () => Promise<void>;
}

interface AuthResponse {
  token: string;
  token_type: string;
  user: BackendUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toDataAvatar = (email: string, name: string): string => {
  const initial = (name?.trim()?.[0] ?? email?.[0] ?? 'U').toUpperCase();
  const bg = '#0ea5e9';
  const fg = '#ffffff';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${bg}'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='${fg}' font-family='Arial, sans-serif' font-size='28'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const toViewUser = (backendUser: BackendUser): User => ({
  ...backendUser,
  points: backendUser.points ?? 0,
  completedModules: backendUser.completedModules ?? 0,
  rank: backendUser.role === UserRole.ADMIN ? 'Administrator' : 'Member',
  avatarUrl: toDataAvatar(backendUser.email, backendUser.name),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const forceLocalLogout = () => {
    apiClient.clearAuthToken();
    setUser(null);
    setUsers([]);
  };

  useEffect(() => {
    apiClient.setUnauthorizedHandler(forceLocalLogout);

    return () => {
      apiClient.setUnauthorizedHandler(null);
    };
  }, []);

  const refreshMe = async (): Promise<void> => {
    const me = await apiClient.get<BackendUser>('/api/v1/me');
    setUser(toViewUser(me));
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = apiClient.getAuthToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshMe();
      } catch {
        forceLocalLogout();
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const payload = await apiClient.post<AuthResponse>('/api/v1/login', {
        email,
        password,
        device_name: 'idn-web',
      });

      apiClient.setAuthToken(payload.token);
      setUser(toViewUser(payload.user));
      return true;
    } catch {
      forceLocalLogout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    void apiClient.post<{ message: string }>('/api/v1/logout').catch(() => undefined);
    forceLocalLogout();
  };

  const fetchUsers = async (page = 1, includeDeleted = false): Promise<{ data: User[]; meta: UsersPaginationMeta }> => {
    const response = await apiClient.get<{ data: BackendUser[]; meta: UsersPaginationMeta }>(
      `/api/v1/admin/users?page=${page}&includeDeleted=${includeDeleted ? '1' : '0'}`,
    );
    const mapped = response.data.map(toViewUser);
    setUsers(mapped);
    return { data: mapped, meta: response.meta };
  };

  const registerUser = async (newUser: { name: string; email: string; password: string; role: UserRole }): Promise<void> => {
    await apiClient.post<BackendUser>('/api/v1/admin/users', newUser);
  };

  const suspendUser = async (id: string): Promise<void> => {
    await apiClient.patch<BackendUser>(`/api/v1/admin/users/${id}/suspend`);
  };

  const unsuspendUser = async (id: string): Promise<void> => {
    await apiClient.patch<BackendUser>(`/api/v1/admin/users/${id}/unsuspend`);
  };

  const resetUserAttempts = async (id: string): Promise<void> => {
    await apiClient.patch<BackendUser>(`/api/v1/admin/users/${id}`, { reset_attempts: true });
  };

  const deleteUser = async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/api/v1/admin/users/${id}`);
  };

  const restoreUser = async (id: string): Promise<void> => {
    await apiClient.post<BackendUser>(`/api/v1/admin/users/${id}/restore`);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      logout,
      isLoading,
      registerUser,
      getAllUsers: () => users,
      fetchUsers,
      suspendUser,
      unsuspendUser,
      resetUserAttempts,
      deleteUser,
      restoreUser,
      refreshMe,
    }),
    [user, isLoading, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
