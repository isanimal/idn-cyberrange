import React from 'react';
import { Link } from 'react-router-dom';
import { LabTemplate } from '../types';
import { Clock, Tag, ArrowRight, Shield } from 'lucide-react';

interface LabCardProps {
  lab: LabTemplate;
}

const LabCard: React.FC<LabCardProps> = ({ lab }) => {
  const getDiffColor = (d: string) => {
    switch(d) {
      case 'EASY': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HARD': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-md transition-all hover:border-idn-500 group flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getDiffColor(lab.difficulty)}`}>
            {lab.difficulty}
          </span>
          <span className="text-xs text-slate-400 font-mono">v{lab.version}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-idn-500 transition-colors">
          {lab.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {lab.short_description}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
           <div className="flex items-center gap-1">
             <Clock size={14} /> {lab.estimated_time_minutes}m
           </div>
           <div className="flex items-center gap-1">
             <Shield size={14} /> {lab.category}
           </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <div className="flex gap-1">
          {lab.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500">
              {tag}
            </span>
          ))}
        </div>
        <Link 
          to={`/labs/${lab.id}`}
          className="text-sm font-bold text-idn-600 dark:text-idn-400 flex items-center gap-1 hover:gap-2 transition-all"
        >
          View Lab <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default LabCard;
