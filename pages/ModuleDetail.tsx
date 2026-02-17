import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MODULES, MOCK_LABS, MOCK_CHALLENGES, MOCK_THEORY_MD } from '../constants';
import { Challenge, Submission } from '../types';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import LabRunner from '../components/Lab/LabRunner';
import ReactMarkdown from 'react-markdown';
import { Book, Terminal, Flag, Check, X, History, CheckCircle } from 'lucide-react';

const ModuleDetail: React.FC = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const module = MODULES.find(m => m.slug === slug);
  const [activeTab, setActiveTab] = useState<'theory' | 'labs'>('theory');
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({});
  
  // Storage Keys
  const historyKey = user && module ? `submissions_${user.id}_${module.id}` : null;
  const challengesKey = user && module ? `challenges_${user.id}_${module.id}` : null;

  // Local state for challenges to handle solved status updates (persisted)
  const [challenges, setChallenges] = useState<Record<string, Challenge[]>>(() => {
    if (challengesKey) {
      const saved = localStorage.getItem(challengesKey);
      if (saved) return JSON.parse(saved);
    }
    return JSON.parse(JSON.stringify(MOCK_CHALLENGES));
  });

  // Submission History State (persisted)
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>(() => {
    if (historyKey) {
      const saved = localStorage.getItem(historyKey);
      if (saved) return JSON.parse(saved, (key, value) => {
        if (key === 'timestamp') return new Date(value);
        return value;
      });
    }
    return [];
  });

  // Persist Changes
  useEffect(() => {
    if (challengesKey) localStorage.setItem(challengesKey, JSON.stringify(challenges));
  }, [challenges, challengesKey]);

  useEffect(() => {
    if (historyKey) localStorage.setItem(historyKey, JSON.stringify(submissionHistory));
  }, [submissionHistory, historyKey]);

  
  if (!module || !user) return <div className="text-slate-800 dark:text-white">Module not found</div>;

  const labs = MOCK_LABS[module.id] || [];

  // Simulate Dynamic Flag Generation: HMAC(secret, user_id + challenge_id)
  // We simulate a Hex-based hash to look like a real HMAC-SHA256 signature
  const getDynamicFlag = (userId: string, challengeId: string) => {
    // Simple string hash function for simulation
    const str = `${userId}_${challengeId}_SUPER_SECRET_SALT`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to absolute hex string
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0') + Math.abs(hash ^ 123456789).toString(16).padStart(8, '0');
    
    return `IDN_LAB{${hexHash.substring(0, 16).toUpperCase()}}`;
  };

  const handleFlagSubmit = (labId: string, challenge: Challenge) => {
    const input = flagInputs[challenge.id]?.trim();
    if (!input) return;

    // Determine correct flag (Support static 'FLAG{...}' for existing mocks, or dynamic)
    const dynamicFlag = getDynamicFlag(user.id, challenge.id);
    
    // Check against dynamic flag OR static fallbacks for existing mocks
    const isCorrect = input === dynamicFlag || input === 'FLAG{header_name}' || input === 'FLAG{random_string}';

    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      challengeId: challenge.id,
      userId: user.id,
      value: input,
      isCorrect,
      timestamp: new Date()
    };

    setSubmissionHistory(prev => [newSubmission, ...prev]);

    if (isCorrect) {
      // Update challenge solved status locally
      setChallenges(prev => ({
        ...prev,
        [labId]: prev[labId].map(c => c.id === challenge.id ? { ...c, solved: true } : c)
      }));
    }

    // Clear input
    setFlagInputs(prev => ({ ...prev, [challenge.id]: '' }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <div className="text-idn-500 font-bold text-sm font-mono mb-2">{module.id.toUpperCase()} // {module.level.toUpperCase()}</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{module.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{module.description}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'theory' ? 'bg-idn-500 text-white shadow-lg shadow-idn-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'}`}
          >
            <Book size={18} /> Theory
          </button>
          <button 
            onClick={() => setActiveTab('labs')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'labs' ? 'bg-idn-500 text-white shadow-lg shadow-idn-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'}`}
          >
            <Terminal size={18} /> Labs & Challenges
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'theory' ? (
          <Card className="prose prose-slate dark:prose-invert max-w-none p-8">
            <ReactMarkdown>{MOCK_THEORY_MD}</ReactMarkdown>
          </Card>
        ) : (
          <div className="space-y-8">
            {labs.length === 0 ? (
               <Card><div className="text-center text-slate-400">No labs available for this module yet.</div></Card>
            ) : (
              labs.map(lab => (
                <div key={lab.id} className="space-y-6">
                  <LabRunner lab={lab} />
                  
                  {/* Challenges Section */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Flag className="text-idn-500" /> Challenges
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {challenges[lab.id]?.map(challenge => (
                        <Card key={challenge.id} className={`border-l-4 ${challenge.solved ? 'border-l-green-500' : 'border-l-slate-400 dark:border-l-slate-600'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                               {challenge.title}
                             </h4>
                             <span className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">{challenge.points} PTS</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{challenge.description}</p>
                          
                          {/* Hint for Dynamic Flag */}
                          <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 break-all">
                             <span className="font-bold text-slate-600 dark:text-slate-400">Target Flag (Unique):</span> {getDynamicFlag(user.id, challenge.id)}
                          </div>

                          {challenge.solved ? (
                            <div className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-2 rounded text-sm flex items-center gap-2 font-bold">
                              <CheckCircle size={16} /> Challenge Solved
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="IDN_LAB{...}"
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm w-full focus:border-idn-500 outline-none text-slate-800 dark:text-white font-mono"
                                value={flagInputs[challenge.id] || ''}
                                onChange={(e) => setFlagInputs(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                              />
                              <button 
                                onClick={() => handleFlagSubmit(lab.id, challenge)}
                                className="bg-idn-500 hover:bg-idn-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm"
                              >
                                Submit
                              </button>
                            </div>
                          )}

                          {/* Submission History for this Challenge */}
                          {submissionHistory.some(s => s.challengeId === challenge.id) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                              <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                <History size={12} /> Submission History
                              </p>
                              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                {submissionHistory.filter(s => s.challengeId === challenge.id).map(sub => (
                                  <div key={sub.id} className="flex justify-between items-center text-xs">
                                    <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{sub.value}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 text-[10px]">
                                        {sub.timestamp.toLocaleTimeString()}
                                      </span>
                                      {sub.isCorrect ? (
                                        <Check size={12} className="text-green-500" />
                                      ) : (
                                        <X size={12} className="text-red-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;