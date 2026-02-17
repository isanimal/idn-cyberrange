import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Server, AlertTriangle, Activity } from 'lucide-react';
import { AdminDashboardOverview } from '../../types';
import { adminDashboardApi } from '../../services/adminDashboardApi';

interface ChartRow {
  name: string;
  submissions: number;
}

const formatter = new Intl.NumberFormat('en-US');
const dayLabelFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

const EMPTY_OVERVIEW: AdminDashboardOverview = {
  metrics: {
    totalUsers: 0,
    activeLabInstances: 0,
    submissions24h: 0,
    failedJobs: 0,
  },
  flagSubmissionsLast7Days: [],
  recentAuditLogs: [],
};

const buildEmptyChartPoints = (): ChartRow[] => {
  const rows: ChartRow[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    rows.push({
      name: dayLabelFormatter.format(date),
      submissions: 0,
    });
  }
  return rows;
};

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminDashboardOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }

    try {
      const payload = await adminDashboardApi.overview();
      setOverview(payload);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard overview';
      setError(message);
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadOverview(true);
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadOverview]);

  const chartData = useMemo<ChartRow[]>(
    () => {
      if (overview.flagSubmissionsLast7Days.length === 0) {
        return buildEmptyChartPoints();
      }

      return overview.flagSubmissionsLast7Days.map((point) => ({
        name: dayLabelFormatter.format(new Date(point.date)),
        submissions: point.count,
      }));
    },
    [overview.flagSubmissionsLast7Days],
  );

  const metrics = overview.metrics;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">System Overview</h1>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {loading ? '...' : formatter.format(metrics.totalUsers)}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-500/10 rounded-full text-green-600 dark:text-green-400">
              <Server size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Active Lab Instances</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {loading ? '...' : formatter.format(metrics.activeLabInstances)}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-full text-purple-600 dark:text-purple-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Submissions (24h)</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {loading ? '...' : formatter.format(metrics.submissions24h)}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Failed Jobs</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {loading ? '...' : formatter.format(metrics.failedJobs)}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Flag Submissions (Last 7 Days)">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'rgba(200,200,200,0.1)' }}
                />
                <Bar dataKey="submissions" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Audit Logs">
          <div className="space-y-4 mt-2">
            {overview.recentAuditLogs.length === 0 && !loading ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">No logs yet</div>
            ) : (
              overview.recentAuditLogs.map((log) => (
                <div
                  key={String(log.id)}
                  className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
                >
                  <div>
                    <span className="font-mono text-xs text-idn-600 dark:text-idn-400 mr-2 bg-idn-50 dark:bg-idn-900/30 px-1.5 py-0.5 rounded">
                      [{log.tag}]
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{log.message}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{log.timeAgo ?? '-'}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
