import React, { useEffect, useMemo, useState } from 'react';
import { DashboardData, User } from '../types';
import Card from '../components/UI/Card';
import { Activity, Award, BookOpen, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/dashboardApi';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await dashboardApi.get();
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const assignedModules = dashboard?.assigned_modules ?? [];
  const activeModules = useMemo(
    () => assignedModules.filter((module) => module.progress_percent > 0 && module.progress_percent < 100),
    [assignedModules],
  );
  const nextModule = useMemo(
    () => assignedModules.find((module) => module.progress_percent === 0 && !module.is_locked),
    [assignedModules],
  );
  const completedModules = useMemo(
    () => assignedModules.filter((module) => module.progress_percent >= 100).length,
    [assignedModules],
  );

  if (isLoading) {
    return <div className="text-slate-500 dark:text-slate-300">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-transparent">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-300 text-sm">Total Points</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dashboard?.total_points ?? user.points}</h3>
            </div>
            <div className="p-3 bg-idn-50 dark:bg-white/10 rounded-lg text-idn-600 dark:text-white">
              <Award size={24} />
            </div>
          </div>
        </Card>
        
        <Card>
           <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Modules Completed</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{completedModules} <span className="text-sm text-slate-400 font-normal">/ {assignedModules.length}</span></h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <BookOpen size={24} />
            </div>
          </div>
        </Card>

        <Card>
           <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Active Labs</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dashboard?.active_labs_count ?? 0}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <Activity size={24} />
            </div>
          </div>
        </Card>

        <Card>
           <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Global Rank</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                {dashboard?.global_rank ? `#${dashboard.global_rank}` : '-'}
              </h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
              <Target size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Continue Learning</h2>
          
          {activeModules.length > 0 ? activeModules.map(module => (
            <Link key={module.id} to={`/modules/${module.slug}`}>
            <Card className="hover:border-idn-500 dark:hover:border-idn-500 transition-colors group cursor-pointer">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-idn-600 dark:group-hover:text-idn-400 transition-colors">{module.title}</h3>
                 <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono text-slate-500">{module.difficulty}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{module.description ?? 'Assigned module'}</p>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 mb-2">
                <div className="bg-idn-500 h-2 rounded-full" style={{ width: `${module.progress_percent}%` }}></div>
              </div>
              <div className="text-right text-xs text-idn-600 dark:text-idn-400 font-bold">{module.progress_percent}% Complete</div>
            </Card>
            </Link>
          )) : (
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-transparent shadow-none">
              <div className="text-center py-8">
                <p className="text-slate-400">No assigned modules yet.</p>
              </div>
            </Card>
          )}

          {nextModule && (
            <div className="mt-8">
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-4">Recommended Next</h3>
               <Link to={`/modules/${nextModule.slug}`}>
                <Card className="hover:border-idn-500 transition-colors group cursor-pointer opacity-90 hover:opacity-100">
                  <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{nextModule.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{nextModule.description ?? 'Continue your assigned path.'}</p>
                  </div>
                    <BookOpen className="text-slate-400 group-hover:text-idn-500 transition-colors" />
                  </div>
                </Card>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Activity</h2>
          <Card>
            <ul className="space-y-4">
              {(dashboard?.recent_activity ?? []).length === 0 ? (
                <li className="text-sm text-slate-500">No recent activity yet.</li>
              ) : (
                (dashboard?.recent_activity ?? []).map((item) => (
                <li key={item.id} className="flex gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-idn-500 mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Submitted flag for <span className="text-idn-600 dark:text-idn-400 font-medium">{item.challenge_title ?? 'Challenge'}</span> ({item.result})
                    </p>
                    <p className="text-xs text-slate-400">{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}</p>
                  </div>
                </li>
              ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
