import React, { useState } from 'react';
import { useLabs } from '../../features/labs/hooks/useLabs';
import { labService } from '../../features/labs/api/labService';
import { Search, Terminal, ExternalLink, X } from 'lucide-react';
import Card from '../../components/UI/Card';
import { LabInstance } from '../../features/labs/types';

const maskEnv = (runtimeMeta: Record<string, unknown> | undefined): Array<{ key: string; value: string }> => {
  const env = (runtimeMeta?.env as Record<string, string> | undefined) ?? {};
  const items = Object.entries(env);

  return items.map(([key, value]) => ({
    key,
    value: /(PASS|SECRET|TOKEN|KEY|FLAG)/i.test(key) ? '******' : value,
  }));
};

const LabCatalog: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: labs, isLoading } = useLabs({ search });
  const [startingLabId, setStartingLabId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [instanceModal, setInstanceModal] = useState<LabInstance | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'env' | 'resources'>('overview');

  const startLab = async (labTemplateId: string) => {
    try {
      setError('');
      setStartingLabId(labTemplateId);
      const instance = await labService.activateLab(labTemplateId);
      setInstanceModal(instance);
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start lab');
    } finally {
      setStartingLabId(null);
    }
  };

  const envRows = maskEnv((instanceModal?.runtime_metadata as Record<string, unknown> | undefined));
  const logsTail = String((instanceModal?.runtime_metadata as Record<string, unknown> | undefined)?.logs_tail ?? '').trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lab Catalog</h1>
          <p className="text-slate-500 text-sm">Explore hands-on environments to test your skills.</p>
        </div>
      </div>

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
        </div>
      </Card>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading labs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <Card key={lab.id} className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {lab.difficulty}
                </span>
                <span className="text-xs text-slate-400 font-mono">v{lab.version}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{lab.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">{lab.short_description}</p>
              </div>
              <div className="text-xs text-slate-500">{lab.estimated_time_minutes}m • {lab.category}</div>
              <button
                type="button"
                onClick={() => void startLab(lab.id)}
                disabled={startingLabId === lab.id}
                className="mt-auto w-full bg-idn-500 hover:bg-idn-600 text-white font-bold py-2 rounded-lg"
              >
                {startingLabId === lab.id ? 'Starting...' : 'Start Lab'}
              </button>
            </Card>
          ))}

          {labs.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">No labs found matching your criteria.</div>
          )}
        </div>
      )}

      {instanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white">Lab Instance Detail</h3>
              <button onClick={() => setInstanceModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 px-4 pt-3">
              {(['overview', 'logs', 'env', 'resources'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${activeTab === tab ? 'bg-idn-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-4 text-sm text-slate-700 dark:text-slate-300 min-h-[240px]">
              {activeTab === 'overview' && (
                <div className="space-y-2">
                  <div>Status: {instanceModal.status || instanceModal.state}</div>
                  <div>Gateway: {instanceModal.gateway || 'n/a'}</div>
                  <div>IP Address: {instanceModal.ip_address || 'n/a'}</div>
                  <div>Port: {instanceModal.assigned_port || '-'}</div>
                  <div className="break-all">URL: {instanceModal.connection_url || instanceModal.access_urls?.[0]?.url || '-'}</div>
                  {(instanceModal.connection_url || instanceModal.access_urls?.[0]?.url) && (
                    <a
                      href={instanceModal.connection_url || instanceModal.access_urls?.[0]?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-idn-600 dark:text-idn-400 font-semibold"
                    >
                      Open Lab <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap break-words">
                  {logsTail || instanceModal.last_error || (
                    <><Terminal size={14} className="inline mr-2" />Logs are not available yet.</>
                  )}
                </div>
              )}

              {activeTab === 'env' && (
                <div className="space-y-2">
                  {envRows.length === 0 ? (
                    <div className="text-slate-500">No environment data available.</div>
                  ) : envRows.map((row) => (
                    <div key={row.key} className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 dark:border-slate-800 pb-1">
                      <span className="font-mono text-slate-500">{row.key}</span>
                      <span className="font-mono">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-1">
                  <div>CPU: {instanceModal.resources?.cpu ?? 'n/a'}</div>
                  <div>Memory: {instanceModal.resources?.memory_mb ?? 'n/a'} MB</div>
                  <div className="text-xs text-slate-500">Timeseries charts soon.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabCatalog;
