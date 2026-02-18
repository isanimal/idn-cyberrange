import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import {
  Terminal, Server, RefreshCw, Power, AlertCircle,
  Cpu, Activity, Box, Eye, X, FileText, Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../services/apiClient';

interface OrchestrationRow {
  instance_id: string;
  user: { id: string; name: string; email: string };
  lab: { id: string; title: string; slug: string; image?: string | null };
  container_id: string | null;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'ERROR';
  started_at: string | null;
  uptime_seconds: number;
  resources: { cpu_percent: number | null; mem_mb: number | null };
  network: {
    container_ip: string | null;
    exposed_ports: Array<{ container_port: string; host_port: string | null }> | null;
    gateway: string | null;
  };
  logs_tail: string;
  env: Record<string, string>;
  last_error: string | null;
}

interface OrchestrationOverviewPayload {
  data: {
    activeContainers: number;
    avgCpu: number | null;
    memAllocated: number | null;
    errors: number;
    instances: OrchestrationRow[];
  };
}

interface PreflightPayload {
  data: {
    ok: boolean;
    checks: {
      workdir: { ok: boolean; message: string; error?: string; hints?: string[] };
      docker: { ok: boolean; message: string; error?: string; hints?: string[] };
    };
  };
}

const formatUptime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const Orchestration: React.FC = () => {
  const [instances, setInstances] = useState<OrchestrationRow[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<OrchestrationRow | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'logs' | 'env' | 'resources'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resourceHistory, setResourceHistory] = useState<Array<{ time: string; cpu: number | null; memory: number | null }>>([]);
  const [preflightWarnings, setPreflightWarnings] = useState<string[]>([]);
  const [overviewStats, setOverviewStats] = useState<{
    activeContainers: number;
    avgCpu: number;
    memAllocated: number;
    errors: number;
  }>({
    activeContainers: 0,
    avgCpu: 0,
    memAllocated: 0,
    errors: 0,
  });

  const loadInstances = async () => {
    setIsLoading(true);
    setError('');
    try {
      try {
        const preflight = await apiClient.get<PreflightPayload>('/api/v1/admin/orchestration/preflight');
        const hints = [
          ...(preflight.data.checks.workdir.hints ?? []),
          ...(preflight.data.checks.docker.hints ?? []),
        ];
        setPreflightWarnings(preflight.data.ok ? [] : Array.from(new Set(hints)));
      } catch (preflightError) {
        const message = preflightError instanceof Error ? preflightError.message : 'Orchestration preflight failed.';
        setPreflightWarnings([message]);
      }

      const response = await apiClient.get<OrchestrationOverviewPayload>('/api/v1/admin/orchestration/overview');
      setInstances(response.data.instances);
      setOverviewStats({
        activeContainers: response.data.activeContainers,
        avgCpu: Math.round(response.data.avgCpu ?? 0),
        memAllocated: response.data.memAllocated ?? 0,
        errors: response.data.errors,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orchestration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInstances();
    const interval = setInterval(() => {
      void loadInstances();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedInstance) {
      setResourceHistory([]);
      return;
    }

    const snapshot = {
      time: new Date().toLocaleTimeString(),
      cpu: selectedInstance.resources.cpu_percent,
      memory: selectedInstance.resources.mem_mb,
    };
    setResourceHistory([snapshot]);
  }, [selectedInstance]);

  const refreshSelectedFromList = (instanceId: string, nextRows: OrchestrationRow[]) => {
    const updated = nextRows.find((row) => row.instance_id === instanceId) ?? null;
    setSelectedInstance(updated);
  };

  const handleForceStop = async (instanceId: string) => {
    setLoadingAction(instanceId);
    setError('');
    try {
      const updated = await apiClient.post<OrchestrationRow>(`/api/v1/admin/orchestration/instances/${instanceId}/force-stop`);
      setInstances((prev) => {
        const next = prev.map((row) => (row.instance_id === updated.instance_id ? updated : row));
        refreshSelectedFromList(instanceId, next);
        return next;
      });
      void loadInstances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force stop instance.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRestart = async (instanceId: string) => {
    setLoadingAction(instanceId);
    setError('');
    try {
      const updated = await apiClient.post<OrchestrationRow>(`/api/v1/admin/orchestration/instances/${instanceId}/restart`);
      setInstances((prev) => {
        const next = prev.map((row) => (row.instance_id === updated.instance_id ? updated : row));
        refreshSelectedFromList(instanceId, next);
        return next;
      });
      void loadInstances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart instance.');
    } finally {
      setLoadingAction(null);
    }
  };

  const stats = useMemo(() => overviewStats, [overviewStats]);

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Terminal className="text-idn-500" /> Lab Orchestration
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage Docker containers, inspect runtime details, and force control running labs.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {preflightWarnings.length > 0 && (
        <div className="bg-amber-50 text-amber-800 border border-amber-200 px-4 py-3 rounded-lg text-sm space-y-1">
          <div className="font-semibold">Orchestration preflight has issues</div>
          {preflightWarnings.slice(0, 4).map((hint, idx) => (
            <div key={`${idx}-${hint}`}>• {hint}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400"><Server /></div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.activeContainers}</div>
              <div className="text-xs text-slate-500">Active Containers</div>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><Cpu /></div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.avgCpu}%</div>
              <div className="text-xs text-slate-500">Avg CPU Load</div>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400"><Activity /></div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(stats.memAllocated)} MB</div>
              <div className="text-xs text-slate-500">Mem Allocated</div>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg text-red-600 dark:text-red-400"><AlertCircle /></div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.errors}</div>
              <div className="text-xs text-slate-500">Errors</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Active Lab Instances" className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Container ID</th>
                <th className="px-6 py-4">Lab Image</th>
                <th className="px-6 py-4">Resources</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-sm text-slate-500">Loading instances...</td>
                </tr>
              ) : instances.map((inst) => (
                <tr
                  key={inst.instance_id}
                  onClick={() => setSelectedInstance(inst)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="text-slate-800 dark:text-white font-medium group-hover:text-idn-500 transition-colors">{inst.user.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{inst.user.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-idn-600 dark:text-idn-400">
                    {inst.container_id ?? '-'}
                    <div className="text-xs text-slate-500">{inst.network.container_ip ?? '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                    {inst.lab.title}
                    <div className="text-xs text-slate-500 font-mono">{inst.lab.image ?? inst.lab.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>CPU</span>
                        <span>{inst.resources.cpu_percent !== null ? `${Math.round(inst.resources.cpu_percent)}%` : 'N/A'}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min(inst.resources.cpu_percent ?? 0, 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>MEM</span>
                        <span>{inst.resources.mem_mb !== null ? `${Math.round(inst.resources.mem_mb)}MB` : 'N/A'}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                        <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${Math.min(((inst.resources.mem_mb ?? 0) / 1024) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      inst.status === 'RUNNING' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                      inst.status === 'ERROR' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                    }`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInstance(inst); }}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-idn-500 transition-colors border border-slate-200 dark:border-slate-700"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        disabled={loadingAction === inst.instance_id || inst.status !== 'RUNNING'}
                        onClick={(e) => { e.stopPropagation(); void handleRestart(inst.instance_id); }}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-idn-600 dark:text-idn-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-700"
                        title="Restart"
                      >
                        <RefreshCw size={16} className={loadingAction === inst.instance_id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        disabled={loadingAction === inst.instance_id || inst.status !== 'RUNNING'}
                        onClick={(e) => { e.stopPropagation(); void handleForceStop(inst.instance_id); }}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-red-500 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-700"
                        title="Stop Forcefully"
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedInstance.status === 'RUNNING' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                }`}>
                  <Box size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedInstance.lab.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-idn-600 dark:text-idn-400">{selectedInstance.container_id ?? '-'}</span>
                    <span>•</span>
                    <span>{selectedInstance.user.name}</span>
                    <span>•</span>
                    <span className={`${selectedInstance.status === 'RUNNING' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {selectedInstance.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedInstance(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-700 px-6">
              <button onClick={() => setDetailTab('overview')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${detailTab === 'overview' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>Overview</button>
              <button onClick={() => setDetailTab('logs')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${detailTab === 'logs' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><FileText size={16} /> Logs</button>
              <button onClick={() => setDetailTab('env')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${detailTab === 'env' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Settings size={16} /> Environment</button>
              <button onClick={() => setDetailTab('resources')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${detailTab === 'resources' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Activity size={16} /> Resources</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {detailTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title="Network">
                    <div className="space-y-2 text-sm">
                      <div><span className="font-semibold">Container IP:</span> {selectedInstance.network.container_ip ?? 'N/A'}</div>
                      <div><span className="font-semibold">Gateway:</span> {selectedInstance.network.gateway ?? 'N/A'}</div>
                      <div>
                        <span className="font-semibold">Exposed Ports:</span>{' '}
                        {selectedInstance.network.exposed_ports?.length
                          ? selectedInstance.network.exposed_ports.map((p) => `${p.host_port ?? '-'} -> ${p.container_port}`).join(', ')
                          : 'N/A'}
                      </div>
                    </div>
                  </Card>
                  <Card title="Runtime">
                    <div className="space-y-2 text-sm">
                      <div><span className="font-semibold">Started At:</span> {selectedInstance.started_at ?? 'N/A'}</div>
                      <div><span className="font-semibold">Uptime:</span> {formatUptime(selectedInstance.uptime_seconds)}</div>
                      <div><span className="font-semibold">Image:</span> {selectedInstance.lab.image ?? selectedInstance.lab.slug}</div>
                      <div><span className="font-semibold">Last Error:</span> {selectedInstance.last_error ?? 'None'}</div>
                    </div>
                  </Card>
                </div>
              )}

              {detailTab === 'logs' && (
                <Card title="Container Logs (tail 200)">
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[420px] whitespace-pre-wrap">
                    {selectedInstance.logs_tail || 'not implemented'}
                  </pre>
                </Card>
              )}

              {detailTab === 'env' && (
                <Card title="Environment Variables (masked)">
                  <div className="space-y-2 max-h-[420px] overflow-auto">
                    {Object.keys(selectedInstance.env).length === 0 ? (
                      <div className="text-sm text-slate-500">No environment variables available.</div>
                    ) : Object.entries(selectedInstance.env).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-3 text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="font-mono text-slate-600 dark:text-slate-300">{key}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 break-all text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {detailTab === 'resources' && (
                <div className="space-y-4">
                  <Card title="Resource Snapshot">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-semibold">CPU:</span> {selectedInstance.resources.cpu_percent !== null ? `${selectedInstance.resources.cpu_percent}%` : 'N/A'}</div>
                      <div><span className="font-semibold">Memory:</span> {selectedInstance.resources.mem_mb !== null ? `${selectedInstance.resources.mem_mb} MB` : 'N/A'}</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Timeseries soon (currently snapshot-only).</p>
                  </Card>
                  <Card title="Resource Chart">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={resourceHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="cpu" stroke="#0ea5e9" fill="#0ea5e933" />
                          <Area type="monotone" dataKey="memory" stroke="#a855f7" fill="#a855f733" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orchestration;
