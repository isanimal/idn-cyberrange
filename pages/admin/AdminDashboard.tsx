import React from 'react';
import Card from '../../components/UI/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Server, AlertTriangle, Activity } from 'lucide-react';

const data = [
  { name: 'Mon', submissions: 40 },
  { name: 'Tue', submissions: 30 },
  { name: 'Wed', submissions: 20 },
  { name: 'Thu', submissions: 27 },
  { name: 'Fri', submissions: 18 },
  { name: 'Sat', submissions: 23 },
  { name: 'Sun', submissions: 34 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">System Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
               <Users size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">1,248</h3>
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
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">42</h3>
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
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">156</h3>
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
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">3</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Flag Submissions (Last 7 Days)">
           <div className="h-[300px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{fill: 'rgba(200,200,200,0.1)'}}
                  />
                  <Bar dataKey="submissions" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>

        <Card title="Recent Audit Logs">
          <div className="space-y-4 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                <div>
                   <span className="font-mono text-xs text-idn-600 dark:text-idn-400 mr-2 bg-idn-50 dark:bg-idn-900/30 px-1.5 py-0.5 rounded">[ADMIN]</span>
                   <span className="text-slate-700 dark:text-slate-300">Updated module "SQL Injection"</span>
                </div>
                <span className="text-slate-400 text-xs">10m ago</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;