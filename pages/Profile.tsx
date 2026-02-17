import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import { MOCK_BADGES, MOCK_ACTIVITY_LOG } from '../constants';
import { 
  Trophy, 
  Target, 
  Zap, 
  Shield, 
  Database, 
  Moon, 
  Sword, 
  Edit2, 
  Save, 
  Key, 
  Mail, 
  User as UserIcon,
  CheckCircle,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Simple mapping for dynamic icons
const IconMap: Record<string, React.ReactNode> = {
  'Sword': <Sword size={24} />,
  'Shield': <Shield size={24} />,
  'Database': <Database size={24} />,
  'Moon': <Moon size={24} />,
};

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Mock form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) return null;

  const skillData = [
    { name: 'Web', value: 80 },
    { name: 'Network', value: 45 },
    { name: 'Crypto', value: 20 },
    { name: 'Forensics', value: 60 },
    { name: 'Osint', value: 30 },
  ];

  // Generate random heatmap data
  const heatmapData = Array.from({ length: 52 }, (_, i) => ({
    week: i,
    count: Math.floor(Math.random() * 5)
  }));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // Logic to update user would go here
    alert('Profile updated successfully (Mock)');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Profile Header */}
      <Card className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row items-center gap-6 p-2">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-idn-500 overflow-hidden shadow-lg shadow-idn-500/20">
               <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-900 rounded-full p-1 border border-idn-500 text-idn-600">
               <Shield size={16} />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
              {user.name}
              <span className="text-xs bg-idn-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                {user.role}
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-mono mb-4">{user.rank} // Level 12</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Trophy className="text-yellow-500" size={20} />
                <div>
                  <p className="text-xs text-slate-500 uppercase">Total Score</p>
                  <p className="font-bold text-slate-800 dark:text-white">{user.points}</p>
                </div>
              </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Target className="text-red-500" size={20} />
                <div>
                  <p className="text-xs text-slate-500 uppercase">Labs Cleared</p>
                  <p className="font-bold text-slate-800 dark:text-white">{user.completedModules}</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Zap className="text-green-500" size={20} />
                <div>
                  <p className="text-xs text-slate-500 uppercase">Streak</p>
                  <p className="font-bold text-slate-800 dark:text-white">4 Days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 self-start md:self-center">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-idn-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
               className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-idn-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Settings
            </button>
          </div>
        </div>
      </Card>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Skills */}
          <div className="space-y-6">
             <Card title="Skill Breakdown">
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={skillData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={70} stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                          cursor={{fill: 'rgba(100,100,100,0.1)'}}
                        />
                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                          {skillData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0ea5e9' : '#10b981'} />
                          ))}
                        </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                </div>
             </Card>

             <Card title="Recent Badges">
               <div className="grid grid-cols-2 gap-4">
                 {MOCK_BADGES.slice(0, 4).map(badge => (
                   <div key={badge.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex flex-col items-center text-center hover:border-idn-500 dark:hover:border-idn-500 transition-colors group">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-full mb-3 text-slate-400 dark:text-slate-500 group-hover:text-white group-hover:bg-idn-500 transition-all shadow-sm">
                        {IconMap[badge.icon] || <Trophy size={24} />}
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{badge.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{badge.date}</p>
                   </div>
                 ))}
               </div>
             </Card>
          </div>

          {/* Right Column: Heatmap & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Activity Heatmap">
              <div className="flex flex-wrap gap-1">
                {heatmapData.map((d, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-sm ${
                      d.count === 0 ? 'bg-slate-100 dark:bg-slate-800' :
                      d.count < 2 ? 'bg-idn-500/30' : 
                      d.count < 4 ? 'bg-idn-500/60' : 'bg-idn-500'
                    }`}
                    title={`${d.count} activities`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-end items-center gap-2 mt-2 text-xs text-slate-500">
                <span>Less</span>
                <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-sm"></div>
                <div className="w-3 h-3 bg-idn-500/30 rounded-sm"></div>
                <div className="w-3 h-3 bg-idn-500/60 rounded-sm"></div>
                <div className="w-3 h-3 bg-idn-500 rounded-sm"></div>
                <span>More</span>
              </div>
            </Card>

            <Card title="Activity Log">
              <div className="space-y-0">
                {MOCK_ACTIVITY_LOG.map((log, idx) => (
                  <div key={log.id} className="flex gap-4 p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center gap-1">
                       <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mb-1"></div>
                       <div className={`p-1.5 rounded-full ${log.points > 0 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-idn-50 dark:bg-idn-500/20 text-idn-600 dark:text-idn-400'}`}>
                         {log.points > 0 ? <CheckCircle size={14} /> : <Clock size={14} />}
                       </div>
                       <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-1"></div>
                    </div>
                    <div className="flex-1 pb-2">
                       <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">{log.action}: <span className="text-slate-500 dark:text-slate-400">{log.target}</span></p>
                       <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-400">{log.date}</span>
                          {log.points > 0 && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-mono">+{log.points} XP</span>}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* SETTINGS TAB REDIRECT/PLACEHOLDER */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card title="Profile Details">
             <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1">Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500 disabled:opacity-50"
                      value={formData.name}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1">Email Address</label>
                   <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="email"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500 disabled:opacity-50"
                      value={formData.email}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-2">
                  {!isEditing ? (
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex items-center gap-2 bg-idn-500 hover:bg-idn-400 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </>
                  )}
                </div>
             </form>
           </Card>

           <Card title="Security">
              <form className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="password"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                 <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="password"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                      placeholder="New password"
                    />
                  </div>
                </div>
                 <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="password"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                   <button 
                      type="button"
                      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 hover:border-red-500 hover:text-red-500 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors"
                    >
                      Update Password
                    </button>
                </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;