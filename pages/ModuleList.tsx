import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/UI/Card';
import { Lock, Unlock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserModuleCardDTO } from '../types';
import { modulesApi } from '../services/modulesApi';

const ModuleList: React.FC = () => {
  const [modules, setModules] = useState<UserModuleCardDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await modulesApi.list();
        setModules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load modules.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filteredModules = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter((module) =>
      module.title.toLowerCase().includes(q) ||
      (module.description ?? '').toLowerCase().includes(q),
    );
  }, [modules, search]);

  const levelLabel = (level: UserModuleCardDTO['level']) => {
    return level === 'BASIC' ? 'Basic' : level === 'INTERMEDIATE' ? 'Intermediate' : 'Advanced';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Training Modules</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search modules..."
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-idn-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-slate-500">Loading modules...</div>
        ) : filteredModules.length === 0 ? (
          <div className="col-span-full text-slate-500">No modules found.</div>
        ) : filteredModules.map((module) => (
          <div key={module.id} className={`relative ${module.is_locked ? 'opacity-70 grayscale' : ''}`}>
             <Link to={module.is_locked ? '#' : `/modules/${module.slug}`}>
              <Card className="h-full hover:border-idn-500 dark:hover:border-idn-500 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    module.level === 'BASIC' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                    module.level === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {levelLabel(module.level)}
                  </span>
                  {module.is_locked ? <Lock size={18} className="text-slate-400" /> : <Unlock size={18} className="text-idn-500" />}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{module.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">{module.description ?? 'No description yet.'}</p>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{module.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${module.progress_percent === 100 ? 'bg-green-500' : 'bg-idn-500'}`} 
                      style={{ width: `${module.progress_percent}%` }}
                    ></div>
                  </div>
                  
                  {!module.is_locked ? (
                    <div className="mt-4 flex justify-end text-idn-600 dark:text-idn-400 text-sm font-semibold flex items-center gap-1">
                      Start Module <ArrowRight size={16} />
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-end text-slate-500 text-sm font-semibold">
                      Locked
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleList;
