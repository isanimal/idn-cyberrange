import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS_DB } from '../constants';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  // Admin Only Functions
  registerUser: (newUser: Partial<User> & { password: string }) => Promise<void>;
  getAllUsers: () => User[];
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local state to simulate database persistence during session
  const [usersDb, setUsersDb] = useState<any[]>(() => {
    const saved = localStorage.getItem('mock_users_db');
    return saved ? JSON.parse(saved) : MOCK_USERS_DB;
  });

  useEffect(() => {
    // Check local storage for active session
    const storedUser = localStorage.getItem('active_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Sync DB changes to local storage
  useEffect(() => {
    localStorage.setItem('mock_users_db', JSON.stringify(usersDb));
  }, [usersDb]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = usersDb.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      // Create a "clean" user object without the password field for state
      const { password: _, ...cleanUser } = foundUser;
      setUser(cleanUser as User);
      localStorage.setItem('active_user', JSON.stringify(cleanUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('active_user');
  };

  // ADMIN ONLY: Register new user
  const registerUser = async (newUser: Partial<User> & { password: string }) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = 'u' + (usersDb.length + 1) + Date.now();
    const userEntry = {
      id,
      points: 0,
      completedModules: 0,
      rank: 'Newbie',
      avatarUrl: `https://ui-avatars.com/api/?name=${newUser.name}&background=0ea5e9&color=fff`,
      ...newUser
    };
    
    setUsersDb([...usersDb, userEntry]);
  };

  const getAllUsers = () => {
    return usersDb.map(({ password, ...u }) => u as User);
  };

  const deleteUser = (id: string) => {
    setUsersDb(usersDb.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, registerUser, getAllUsers, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};