import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLabDetail, useLabMutations } from '../../features/labs/hooks/useLabs';
import Card from '../../components/UI/Card';
import ReactMarkdown from 'react-markdown';
import { Play, Pause, AlertTriangle, CheckCircle, Terminal, RotateCcw, Save } from 'lucide-react';

const LabDetail: React.FC = () => {
  const { id } = useParams();
  const { data: lab, isLoading, refetch } = useLabDetail(id || '');
  const instanceId = lab?.user_instance?.instance_id ?? '';
  const { activate, deactivate, restart, updateNotes, isActivating } = useLabMutations(
    lab?.id ?? '',
    lab?.user_instance?.instance_id ?? null,
    refetch,
  );
  const [notes, setNotes] = useState('');

  if (isLoading || !lab) return <div className="p-8">Loading...</div>;

  const instance = lab.user_instance;
  const isVersionOutdated = instance && instance.template_version_pinned !== lab.version;

  const handleNotesSave = () => {
    updateNotes(notes);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Version Banner */}
      {isVersionOutdated && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mt-1" size={20} />
          <div>
            <h4 className="font-bold text-yellow-800 dark:text-yellow-400">New Version Available ({lab.version})</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
              You are running on pinned version <strong>{instance.template_version_pinned}</strong>. 
              Upgrading will reset your instance progress.
            </p>
            <button className="mt-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded font-bold transition-colors">
              Upgrade Instance
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="px-2 py-1 bg-idn-100 text-idn-700 dark:bg-idn-900/30 dark:text-idn-400 text-xs font-bold rounded uppercase">
                 {lab.category}
               </span>
               <span className="text-slate-400 text-sm font-mono">v{lab.version}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{lab.title}</h1>
            <p className="text-slate-500 text-lg mt-2">{lab.short_description}</p>
          </div>

          <Card title="Lab Guide">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{lab.long_description}</ReactMarkdown>
            </div>
          </Card>

          <Card title="Objectives">
            <ul className="space-y-2">
              {lab.objectives.map((obj, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-idn-500"></div>
                  {obj}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar / Instance Panel */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-idn-500 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Terminal size={32} className="text-idn-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Lab Control</h3>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                {instance ? `Status: ${instance.state}` : 'Ready to Start'}
              </p>
            </div>

            {!instance ? (
              <button 
                onClick={activate}
                disabled={isActivating}
                className="w-full bg-idn-500 hover:bg-idn-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {isActivating ? 'Provisioning...' : <><Play size={18} /> Activate Lab</>}
              </button>
            ) : (
              <div className="space-y-3">
                {instance.state === 'ACTIVE' ? (
                  <>
                    <div className="bg-slate-900 rounded p-3 font-mono text-xs text-green-400 mb-4 break-all">
                      target: {instance.gateway || 'n/a'}<br/>
                      port: {instance.assigned_port || '-'}<br/>
                      url: {instance.connection_url || instance.access_urls?.[0]?.url || '-'}
                    </div>
                    <button 
                      onClick={() => deactivate(instance.instance_id)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Pause size={18} /> Pause / Stop
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Submit Flag
                    </button>
                  </>
                ) : (
                <button onClick={activate} className="w-full bg-idn-500 hover:bg-idn-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                  <Play size={18} /> Resume Lab
                </button>
                )}
                
                <button
                  onClick={() => instance && restart(instance.instance_id)}
                  className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> Restart
                </button>
              </div>
            )}
          </Card>

          {instance && (
            <Card title="My Notes">
              <textarea 
                className="w-full h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-3 text-sm outline-none focus:border-idn-500"
                placeholder="Jot down your findings (markdown supported)..."
                defaultValue={instance.notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleNotesSave}
                  className="text-xs flex items-center gap-1 text-slate-500 hover:text-idn-500"
                >
                  <Save size={14} /> Save Notes
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabDetail;
