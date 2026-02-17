import React, { useState, useEffect } from 'react';
import { Lab } from '../../types';
import { Play, Square, Clock, Copy, Terminal, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import Card from '../UI/Card';

interface LabRunnerProps {
  lab: Lab;
}

const LabRunner: React.FC<LabRunnerProps> = ({ lab: initialLab }) => {
  // Use local storage to persist lab state across reloads (mocking backend persistence)
  const storageKey = `lab_session_${initialLab.id}`;
  
  const [lab, setLab] = useState<Lab>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if expired while away
      if (parsed.status === 'RUNNING' && parsed.expiresAt) {
        if (new Date(parsed.expiresAt).getTime() < Date.now()) {
          // Lab expired while we were away
          return { ...initialLab, status: 'STOPPED' };
        }
      }
      return parsed;
    }
    return initialLab;
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [provisioningState, setProvisioningState] = useState<string>('');

  // Persist lab state
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lab));
  }, [lab, storageKey]);

  // Timer & Auto-stop Logic
  useEffect(() => {
    let interval: any;

    if (lab.status === 'RUNNING' && lab.expiresAt) {
      const updateTimer = () => {
        const now = Date.now();
        const expires = new Date(lab.expiresAt!).getTime();
        const diff = Math.floor((expires - now) / 1000);
        
        if (diff <= 0) {
          handleStop();
          setTimeLeft(0);
        } else {
          setTimeLeft(diff);
        }
      };

      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(0);
    }

    return () => clearInterval(interval);
  }, [lab.status, lab.expiresAt]);

  // Provisioning Simulation
  useEffect(() => {
    if (lab.status === 'STARTING') {
      setProvisioningState('Provisioning resources...');
      
      const t1 = setTimeout(() => setProvisioningState('Starting container...'), 1500);
      const t2 = setTimeout(() => setProvisioningState('Running health checks...'), 3000);
      const t3 = setTimeout(() => {
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        setLab(prev => ({
          ...prev,
          status: 'RUNNING',
          endpoint: 'http://10.10.14.22:8080',
          containerId: 'docker-container-' + Math.random().toString(36).substr(2, 6),
          expiresAt: expiresAt
        }));
        setProvisioningState('');
      }, 4500); // Total boot time

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [lab.status]);

  const handleStart = () => {
    setLab(prev => ({ ...prev, status: 'STARTING' }));
  };

  const handleStop = () => {
    setLab(prev => ({ 
      ...prev, 
      status: 'STOPPED', 
      endpoint: undefined, 
      containerId: undefined,
      expiresAt: undefined
    }));
    setProvisioningState('');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-t-4 border-t-idn-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Terminal className="text-idn-500" />
            {lab.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Docker Environment • Isolated • {lab.difficulty}</p>
        </div>

        <div className="flex items-center gap-3">
          {lab.status === 'STOPPED' && (
            <button 
              onClick={handleStart}
              className="flex items-center gap-2 bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-idn-500/20"
            >
              <Play size={18} /> Start Lab
            </button>
          )}

          {lab.status === 'STARTING' && (
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <Loader2 size={18} className="animate-spin text-idn-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{provisioningState}</span>
            </div>
          )}

          {lab.status === 'RUNNING' && (
            <>
              <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 font-mono font-bold transition-colors ${
                timeLeft < 300 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <Clock size={16} />
                {formatTime(timeLeft)}
              </div>
              <button 
                onClick={handleStop}
                className="flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors"
              >
                <Square size={18} /> Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Console / Connection Info */}
      {lab.status === 'RUNNING' && lab.endpoint && (
        <div className="mt-6 bg-slate-900 rounded-lg p-4 font-mono text-sm border border-slate-700 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Terminal size={120} className="text-white" />
          </div>
          <div className="flex justify-between items-center text-slate-400 mb-4 text-xs uppercase tracking-widest relative z-10">
            <span>Connection Details</span>
            <span className="flex items-center gap-1.5 text-green-400 font-bold"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Environment</span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 relative z-10">
            <div>
              <label className="text-slate-500 text-xs block mb-1 font-bold uppercase">Target IP / URL</label>
              <div className="flex items-center gap-2">
                <code className="text-green-400 bg-black/50 px-3 py-2 rounded-lg w-full border border-slate-700">
                  {lab.endpoint}
                </code>
                <button 
                   className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                   title="Copy to clipboard"
                   onClick={() => navigator.clipboard.writeText(lab.endpoint!)}
                >
                  <Copy size={16} />
                </button>
                <a 
                  href={lab.endpoint} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 bg-idn-600 hover:bg-idn-500 rounded-lg text-white transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            
            <div>
               <label className="text-slate-500 text-xs block mb-1 font-bold uppercase">System Status</label>
               <div className="flex flex-col gap-2">
                 <div className="text-green-400 flex items-center gap-2 text-xs">
                   <CheckCircle size={14} /> Container Healthy
                 </div>
                 <div className="text-green-400 flex items-center gap-2 text-xs">
                   <CheckCircle size={14} /> Services Exposed (Port 80, 8080)
                 </div>
                 <div className="text-slate-500 flex items-center gap-2 text-xs">
                   <Clock size={14} /> Expires in {Math.floor(timeLeft / 60)} minutes
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LabRunner;