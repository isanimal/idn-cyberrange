import React, { useState } from 'react';
import { useLabs } from '../../features/labs/hooks/useLabs';
import LabCard from '../../features/labs/components/LabCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import Card from '../../components/UI/Card';

const LabCatalog: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: labs, isLoading } = useLabs({ search });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lab Catalog</h1>
          <p className="text-slate-500 text-sm">Explore hands-on environments to test your skills.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search labs by name or tag..." 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-600 dark:text-slate-300 outline-none">
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-600 dark:text-slate-300 outline-none">
              <option value="">All Categories</option>
              <option value="Web">Web</option>
              <option value="Network">Network</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading labs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map(lab => (
            <LabCard key={lab.id} lab={lab} />
          ))}
          {labs.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No labs found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabCatalog;
