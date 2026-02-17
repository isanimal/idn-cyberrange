import React, { useState } from 'react';
import Card from '../components/UI/Card';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Shield, Lock, Save, Mail, Smartphone, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
  
  // Mock States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'general' 
                ? 'bg-idn-500 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <User size={18} /> General
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications' 
                ? 'bg-idn-500 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
           <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security' 
                ? 'bg-idn-500 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <Card title="Profile Information">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img src={user?.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-700" />
                  <div>
                    <button className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. Max 1MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Display Name</label>
                    <input type="text" defaultValue={user?.name} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-idn-500" />
                  </div>
                   <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Job Title</label>
                    <input type="text" placeholder="e.g. Junior Pentester" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-idn-500" />
                  </div>
                   <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Bio</label>
                    <textarea rows={3} placeholder="Tell us about yourself" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-idn-500" />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-end">
                  <button className="bg-idn-500 hover:bg-idn-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <Card title="Notification Preferences">
              <div className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-lg">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Email Notifications</h4>
                      <p className="text-xs text-slate-500">Receive updates about module progress.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-idn-300 dark:peer-focus:ring-idn-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-idn-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-lg">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Push Notifications</h4>
                      <p className="text-xs text-slate-500">Get alerts when labs are ready.</p>
                    </div>
                  </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-idn-300 dark:peer-focus:ring-idn-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-idn-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-lg">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Marketing & News</h4>
                      <p className="text-xs text-slate-500">Receive news about new modules.</p>
                    </div>
                  </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={marketing} onChange={() => setMarketing(!marketing)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-idn-300 dark:peer-focus:ring-idn-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-idn-500"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

           {/* SECURITY TAB */}
           {activeTab === 'security' && (
            <Card title="Security Settings">
               <form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="password"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input 
                        type="password"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                        placeholder="New password"
                      />
                    </div>
                  </div>
                   <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input 
                        type="password"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                        placeholder="Confirm"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between items-center">
                   <div className="text-xs text-slate-400">
                     Two-factor authentication is currently <span className="text-red-500 font-bold">Disabled</span>.
                   </div>
                   <button type="button" className="bg-idn-500 hover:bg-idn-600 text-white px-6 py-2 rounded-lg font-bold">
                      Update Password
                   </button>
                </div>
              </form>
            </Card>
           )}

        </div>
      </div>
    </div>
  );
};

export default Settings;