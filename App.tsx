import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ModuleList from './pages/ModuleList';
import ModuleDetail from './pages/ModuleDetail';
// New Lab Pages
import LabCatalog from './pages/Labs/LabCatalog';
import LabDetail from './pages/Labs/LabDetail';
import LabManager from './pages/admin/LabManager'; // Admin

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ModuleManagement from './pages/admin/ModuleManagement';
import Orchestration from './pages/admin/Orchestration';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import RequireAuth from './components/Auth/RequireAuth';

// Wrapper to inject user into Layout
const MainLayoutWrapper: React.FC = () => {
  const { user } = useAuth();
  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes (User & Admin) */}
            <Route element={<RequireAuth><MainLayoutWrapper /></RequireAuth>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardWrapper />} />
              <Route path="/modules" element={<ModuleList />} />
              <Route path="/modules/:slug" element={<ModuleDetail />} />
              
              {/* NEW LAB ROUTES */}
              <Route path="/labs" element={<LabCatalog />} />
              <Route path="/labs/:id" element={<LabDetail />} />
              
              <Route path="/cheatsheets" element={<div className="text-slate-800 dark:text-white p-8">Cheatsheets Coming Soon</div>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<RequireAuth allowedRoles={[UserRole.ADMIN]}><MainLayoutWrapper /></RequireAuth>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/modules" element={<ModuleManagement />} />
              <Route path="/admin/labs" element={<Orchestration />} />
              <Route path="/admin/lab-manager" element={<LabManager />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Helper component to pass user prop to Dashboard
const DashboardWrapper: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <Dashboard user={user} />;
};

export default App;
