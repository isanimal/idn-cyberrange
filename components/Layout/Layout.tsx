import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import { User } from '../../types';
import { Bell, Search, User as UserIcon, LogOut, Settings, User as UserProfileIcon, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; // Should be handled by Auth Guard

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Sidebar role={user.role} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-200">
          <div className="flex items-center w-96 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 border border-transparent focus-within:border-idn-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
            <Search size={18} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search labs, modules..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-idn-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative cursor-pointer">
              <Bell size={20} className="text-slate-400 hover:text-idn-500 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-idn-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </div>
            
            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 focus:outline-none group"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-idn-500 transition-colors">{user.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.points} PTS</div>
                </div>
                <div className={`w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 ${isDropdownOpen ? 'border-idn-500' : 'border-white dark:border-slate-600'} flex items-center justify-center overflow-hidden transition-all shadow-sm`}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 transform origin-top-right transition-all">
                   <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 sm:hidden">
                    <p className="text-sm text-slate-800 dark:text-white font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  
                  <div className="px-2">
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-idn-500 dark:hover:text-white rounded-lg transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserProfileIcon size={16} /> 
                      <span>My Profile</span>
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-idn-500 dark:hover:text-white rounded-lg transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings size={16} /> 
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>
                  
                  <div className="px-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut size={16} /> 
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;