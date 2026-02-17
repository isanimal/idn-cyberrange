import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/UI/Card';
import { Lock, Unlock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModuleSummary } from '../types';
import { modulesApi } from '../services/modulesApi';

const ModuleList: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [startingModuleId, setStartingModuleId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await modulesApi.listModules();
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
      (module.description ?? '').toLowerCase().includes(q) ||
      module.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [modules, search]);

  const levelLabel = (difficulty: ModuleSummary['difficulty']) => {
    return difficulty === 'BASIC' ? 'Basic' : difficulty === 'INTERMEDIATE' ? 'Intermediate' : 'Advanced';
  };

  const onStartModule = async (module: ModuleSummary) => {
    if (module.is_locked) {
      return;
    }

    try {
      setStartingModuleId(module.id);
      await modulesApi.startModule(module.slug);
      navigate(`/modules/${module.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start module.');
    } finally {
      setStartingModuleId(null);
    }
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
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[260px] animate-pulse">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              </Card>
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-slate-500 dark:text-slate-400 text-sm">No modules published.</div>
          </Card>
        ) : filteredModules.map((module) => (
          <div key={module.id} className={`relative ${module.is_locked ? 'opacity-70 grayscale' : ''}`}>
            <Card className="h-full hover:border-idn-500 dark:hover:border-idn-500 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  module.difficulty === 'BASIC' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                  module.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                  'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  {levelLabel(module.difficulty)}
                </span>
                {module.is_locked ? <Lock size={18} className="text-slate-400" /> : <Unlock size={18} className="text-idn-500" />}
              </div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{module.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{module.description ?? 'No description yet.'}</p>

              {module.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {module.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Progress</span>
                  <span>{module.progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${module.progress_percent === 100 ? 'bg-green-500' : 'bg-idn-500'}`}
                    style={{ width: `${module.progress_percent}%` }}
                  />
                </div>

                {!module.is_locked ? (
                  <button
                    type="button"
                    className="mt-4 w-full flex justify-center text-idn-600 dark:text-idn-400 text-sm font-semibold items-center gap-1 disabled:opacity-60"
                    disabled={startingModuleId === module.id}
                    onClick={() => void onStartModule(module)}
                  >
                    {startingModuleId === module.id ? 'Starting...' : 'Start Module'} <ArrowRight size={16} />
                  </button>
                ) : (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-end text-slate-500 text-sm font-semibold">
                      Locked
                    </div>
                    {module.locked_reason ? (
                      <div className="text-[11px] text-slate-500 text-right">{module.locked_reason}</div>
                    ) : null}
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleList;
