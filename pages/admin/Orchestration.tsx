import React, { useState, useEffect } from 'react';
import Card from '../../components/UI/Card';
import { 
  Terminal, Server, RefreshCw, Power, AlertCircle, 
  Cpu, Activity, Box, Eye, X, FileText, Settings, Network 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Mock Data Types for Orchestration
interface ContainerInstance {
  id: string;
  userId: string;
  userName: string;
  labName: string;
  containerId: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'ERROR';
  uptime: string;
  cpu: number;
  memory: number;
  ip: string;
}

const MOCK_INSTANCES: ContainerInstance[] = [
  { id: '1', userId: 'u1', userName: 'Neo Anderson', labName: 'SQL Injection Basic', containerId: 'daf48a91b2', status: 'RUNNING', uptime: '00:45:12', cpu: 12, memory: 256, ip: '10.10.14.22' },
  { id: '2', userId: 'u2', userName: 'Trinity', labName: 'XSS Stored', containerId: 'c12b918aa1', status: 'RUNNING', uptime: '01:20:05', cpu: 45, memory: 512, ip: '10.10.14.23' },
  { id: '3', userId: 'u3', userName: 'Morpheus', labName: 'Burp Suite Intro', containerId: 'e5512bb911', status: 'ERROR', uptime: '00:00:00', cpu: 0, memory: 0, ip: '-' },
];

// Mock Logs Generator
const generateMockLogs = (containerId: string) => [
  `[2023-10-27 10:00:01] [INFO] Container ${containerId} started`,
  `[2023-10-27 10:00:02] [INFO] Service listening on port 80`,
  `[2023-10-27 10:00:02] [INFO] Database connection established`,
  `[2023-10-27 10:05:12] [WARN] High latency detected on /api/v1/query`,
  `[2023-10-27 10:15:30] [INFO] User interaction detected`,
  `[2023-10-27 10:15:31] [INFO] GET /login 200 OK`,
  `[2023-10-27 10:20:45] [INFO] POST /submit 200 OK`,
];

// Mock Env Vars
const MOCK_ENV_VARS = {
  "NODE_ENV": "production",
  "DB_HOST": "10.10.14.5",
  "DB_USER": "lab_user",
  "FLAG_SECRET": "****************",
  "MAX_CONNECTIONS": "100",
  "LOG_LEVEL": "debug"
};

const Orchestration: React.FC = () => {
  const [instances, setInstances] = useState<ContainerInstance[]>(MOCK_INSTANCES);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Detail Modal State
  const [selectedInstance, setSelectedInstance] = useState<ContainerInstance | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'logs' | 'env' | 'resources'>('overview');

  // Resource Chart Data (Mock)
  const [resourceHistory, setResourceHistory] = useState<any[]>([]);

  // Simulate live metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setInstances(prev => prev.map(inst => {
        if (inst.status === 'RUNNING') {
          return {
            ...inst,
            cpu: Math.max(2, Math.min(100, inst.cpu + (Math.random() * 10 - 5))),
            memory: Math.max(128, Math.min(1024, inst.memory + (Math.random() * 20 - 10)))
          };
        }
        return inst;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Generate historical data when modal opens
  useEffect(() => {
    if (selectedInstance) {
      const data = Array.from({ length: 20 }, (_, i) => ({
        time: `${10 + Math.floor(i/2)}:${(i%2)*30}`,
        cpu: Math.floor(Math.random() * 60) + 10,
        memory: Math.floor(Math.random() * 400) + 200
      }));
      setResourceHistory(data);
    }
  }, [selectedInstance]);

  const handleAction = async (e: React.MouseEvent, id: string, action: 'STOP' | 'RESTART' | 'KILL') => {
    e.stopPropagation(); // Prevent opening modal
    setLoadingAction(id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setInstances(prev => prev.map(inst => {
      if (inst.id === id) {
        if (action === 'STOP') return { ...inst, status: 'STOPPED', cpu: 0, memory: 0 };
        if (action === 'RESTART') return { ...inst, status: 'RUNNING', uptime: '00:00:01' };
        if (action === 'KILL') return { ...inst, status: 'ERROR' };
      }
      return inst;
    }));
    setLoadingAction(null);
  };

  const activeCount = instances.filter(i => i.status === 'RUNNING').length;
  const totalCpu = instances.reduce((acc, curr) => acc + curr.cpu, 0);

  return (
    <div className="space-y-6 relative">
       <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Terminal className="text-idn-500" /> Lab Orchestration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage Docker containers, view resource usage, and handle orchestration templates.</p>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="border-l-4 border-l-green-500">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400"><Server /></div>
             <div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white">{activeCount}</div>
               <div className="text-xs text-slate-500">Active Containers</div>
             </div>
           </div>
         </Card>
         <Card className="border-l-4 border-l-blue-500">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><Cpu /></div>
             <div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(totalCpu / 4)}%</div>
               <div className="text-xs text-slate-500">Avg CPU Load</div>
             </div>
           </div>
         </Card>
         <Card className="border-l-4 border-l-purple-500">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400"><Activity /></div>
             <div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white">12GB</div>
               <div className="text-xs text-slate-500">Mem Allocated</div>
             </div>
           </div>
         </Card>
         <Card className="border-l-4 border-l-red-500">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg text-red-600 dark:text-red-400"><AlertCircle /></div>
             <div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white">1</div>
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
               {instances.map((inst) => (
                 <tr 
                   key={inst.id} 
                   onClick={() => setSelectedInstance(inst)}
                   className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                 >
                   <td className="px-6 py-4">
                     <div className="text-slate-800 dark:text-white font-medium group-hover:text-idn-500 transition-colors">{inst.userName}</div>
                     <div className="text-xs text-slate-500 font-mono">{inst.userId}</div>
                   </td>
                   <td className="px-6 py-4 font-mono text-sm text-idn-600 dark:text-idn-400">
                     {inst.containerId}
                     <div className="text-xs text-slate-500">{inst.ip}</div>
                   </td>
                   <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                     {inst.labName}
                     <div className="text-xs text-slate-500 font-mono">uptime: {inst.uptime}</div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="w-24 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>CPU</span>
                          <span>{Math.round(inst.cpu)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                          <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min(inst.cpu, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>MEM</span>
                          <span>{Math.round(inst.memory)}MB</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                          <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${(inst.memory/1024)*100}%` }}></div>
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
                         disabled={loadingAction === inst.id || inst.status !== 'RUNNING'}
                         onClick={(e) => handleAction(e, inst.id, 'RESTART')}
                         className="p-1.5 bg-slate-100 dark:bg-slate-800 text-idn-600 dark:text-idn-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-700"
                         title="Restart"
                       >
                         <RefreshCw size={16} className={loadingAction === inst.id ? 'animate-spin' : ''} />
                       </button>
                       <button 
                         disabled={loadingAction === inst.id || inst.status === 'STOPPED'}
                         onClick={(e) => handleAction(e, inst.id, 'STOP')}
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

       <Card title="Available Lab Templates">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {['kali-linux-web', 'vuln-dvwa', 'vuln-juice-shop'].map((template, idx) => (
               <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-start gap-4 hover:border-idn-500 dark:hover:border-idn-500 transition-colors cursor-pointer shadow-sm">
                 <div className={`p-2 rounded ${idx === 0 ? 'bg-blue-100 text-blue-600' : idx === 1 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'} dark:bg-opacity-20`}>
                   <Box size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-white text-sm">{template}</h4>
                   <p className="text-xs text-slate-500 mt-1">Standard environment configuration.</p>
                   <div className="mt-2 text-xs font-mono text-slate-400">v2023.4 • 2.4GB</div>
                 </div>
               </div>
            ))}
         </div>
       </Card>

       {/* Instance Detail Modal */}
       {selectedInstance && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
             {/* Modal Header */}
             <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    selectedInstance.status === 'RUNNING' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                  }`}>
                    <Box size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedInstance.labName}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-idn-600 dark:text-idn-400">{selectedInstance.containerId}</span>
                      <span>•</span>
                      <span>{selectedInstance.userName}</span>
                      <span>•</span>
                      <span className={`${
                        selectedInstance.status === 'RUNNING' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      }`}>{selectedInstance.status}</span>
                    </div>
                  </div>
               </div>
               <button 
                onClick={() => setSelectedInstance(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
               >
                 <X size={24} />
               </button>
             </div>

             {/* Modal Tabs */}
             <div className="flex border-b border-slate-100 dark:border-slate-700 px-6">
               <button 
                 onClick={() => setDetailTab('overview')}
                 className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                   detailTab === 'overview' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 Overview
               </button>
               <button 
                 onClick={() => setDetailTab('logs')}
                 className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                   detailTab === 'logs' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 <FileText size={16} /> Logs
               </button>
               <button 
                 onClick={() => setDetailTab('env')}
                 className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                   detailTab === 'env' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 <Settings size={16} /> Environment
               </button>
               <button 
                 onClick={() => setDetailTab('resources')}
                 className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                   detailTab === 'resources' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 <Activity size={16} /> Resources
               </button>
             </div>

             {/* Modal Content */}
             <div className="p-6 overflow-y-auto min-h-[400px]">
               
               {/* OVERVIEW TAB */}
               {detailTab === 'overview' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                     <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                       <Network size={16} /> Network Configuration
                     </h4>
                     <div className="space-y-3">
                       <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                         <span className="text-slate-500 text-sm">IP Address</span>
                         <span className="text-slate-800 dark:text-white font-mono">{selectedInstance.ip}</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                         <span className="text-slate-500 text-sm">Exposed Ports</span>
                         <span className="text-slate-800 dark:text-white font-mono">80, 443, 8080</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                         <span className="text-slate-500 text-sm">Network Mode</span>
                         <span className="text-slate-800 dark:text-white font-mono">bridge</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500 text-sm">Gateway</span>
                         <span className="text-slate-800 dark:text-white font-mono">10.10.14.1</span>
                       </div>
                     </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                     <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                       <Cpu size={16} /> Limits & Quotas
                     </h4>
                     <div className="space-y-3">
                       <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                         <span className="text-slate-500 text-sm">Max Memory</span>
                         <span className="text-slate-800 dark:text-white font-mono">512 MB</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                         <span className="text-slate-500 text-sm">CPU Shares</span>
                         <span className="text-slate-800 dark:text-white font-mono">1.0 vCPU</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                         <span className="text-slate-500 text-sm">Max TTL</span>
                         <span className="text-slate-800 dark:text-white font-mono">2 Hours</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500 text-sm">Started At</span>
                         <span className="text-slate-800 dark:text-white font-mono">2023-10-27 10:00:00</span>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* LOGS TAB */}
               {detailTab === 'logs' && (
                 <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm h-full overflow-y-auto max-h-[400px]">
                   {generateMockLogs(selectedInstance.containerId).map((log, i) => (
                     <div key={i} className="text-green-500 mb-1 border-l-2 border-transparent hover:border-idn-500 pl-2">
                       {log}
                     </div>
                   ))}
                   <div className="animate-pulse text-green-500">_</div>
                 </div>
               )}

               {/* ENV VARS TAB */}
               {detailTab === 'env' && (
                 <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500">
                         <th className="px-4 py-2">Variable Key</th>
                         <th className="px-4 py-2">Value</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-sm">
                       {Object.entries(MOCK_ENV_VARS).map(([key, value]) => (
                         <tr key={key}>
                           <td className="px-4 py-3 text-idn-600 dark:text-idn-400">{key}</td>
                           <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{value}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

               {/* RESOURCES TAB */}
               {detailTab === 'resources' && (
                 <div className="space-y-6">
                   <div>
                     <h4 className="text-sm text-slate-500 mb-2">CPU Usage (Last 10m)</h4>
                     <div className="h-48 w-full bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={resourceHistory}>
                           <defs>
                             <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                               <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
                           <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                           <YAxis stroke="#64748b" fontSize={12} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }}
                           />
                           <Area type="monotone" dataKey="cpu" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCpu)" />
                         </AreaChart>
                       </ResponsiveContainer>
                     </div>
                   </div>

                   <div>
                     <h4 className="text-sm text-slate-500 mb-2">Memory Usage (MB)</h4>
                     <div className="h-48 w-full bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={resourceHistory}>
                           <defs>
                             <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                               <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
                           <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                           <YAxis stroke="#64748b" fontSize={12} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }}
                           />
                           <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#colorMem)" />
                         </AreaChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                 </div>
               )}
             </div>

             {/* Modal Footer */}
             <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
               <button 
                  onClick={() => setSelectedInstance(null)}
                  className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Close
                </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default Orchestration;