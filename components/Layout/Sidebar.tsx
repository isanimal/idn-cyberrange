import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Terminal,
  ShieldAlert,
  LogOut,
  FileText,
  Users,
  Box,
} from "lucide-react";
import { UserRole } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
      isActive
        ? "bg-idn-50 text-idn-600 dark:bg-idn-500/10 dark:text-idn-500 border-r-2 border-idn-500"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
    }`;

  return (
    <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col sticky top-0 left-0 transition-colors duration-200">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          {/* IDN Logo Area */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              {/* assets are served from /assets since public/ is the root for static files */}
              <img
                src="/assets/IDN.png"
                alt="IDN Logo"
                className="w-full h-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                ID-Networkers
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-tight mt-1">
                IT Expert Factory
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-4 mb-3 uppercase tracking-wider">
          Platform
        </div>
        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/labs" className={linkClass}>
          <Box size={20} />
          <span>Labs Catalog</span>
        </NavLink>
        <NavLink to="/modules" className={linkClass}>
          <BookOpen size={20} />
          <span>Modules</span>
        </NavLink>
        <NavLink to="/cheatsheets" className={linkClass}>
          <FileText size={20} />
          <span>Cheatsheets</span>
        </NavLink>

        {role === UserRole.ADMIN && (
          <>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-4 mt-8 mb-3 uppercase tracking-wider">
              Administration
            </div>
            <NavLink to="/admin" className={linkClass} end>
              <ShieldAlert size={20} />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/admin/lab-manager" className={linkClass}>
              <Box size={20} />
              <span>Manage Labs</span>
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <Users size={20} />
              <span>User Management</span>
            </NavLink>
            <NavLink to="/admin/modules" className={linkClass}>
              <BookOpen size={20} />
              <span>Manage Modules</span>
            </NavLink>
            <NavLink to="/admin/labs" className={linkClass}>
              <Terminal size={20} />
              <span>Orchestration</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-slate-500 hover:text-idn-600 hover:bg-idn-50 dark:hover:bg-idn-900/10 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors font-medium text-sm"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
