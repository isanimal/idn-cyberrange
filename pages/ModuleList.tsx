import React from 'react';
import { MODULES } from '../constants';
import Card from '../components/UI/Card';
import { Lock, Unlock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModuleList: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Training Modules</h1>
        <div className="flex gap-2">
          {/* Filters could go here */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MODULES.map((module) => (
          <div key={module.id} className={`relative ${module.isLocked ? 'opacity-70 grayscale' : ''}`}>
             <Link to={module.isLocked ? '#' : `/modules/${module.slug}`}>
              <Card className="h-full hover:border-idn-500 dark:hover:border-idn-500 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    module.level === 'Basic' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                    module.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {module.level}
                  </span>
                  {module.isLocked ? <Lock size={18} className="text-slate-400" /> : <Unlock size={18} className="text-idn-500" />}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{module.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">{module.description}</p>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${module.progress === 100 ? 'bg-green-500' : 'bg-idn-500'}`} 
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                  
                  {!module.isLocked && (
                    <div className="mt-4 flex justify-end text-idn-600 dark:text-idn-400 text-sm font-semibold flex items-center gap-1">
                      Start Module <ArrowRight size={16} />
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