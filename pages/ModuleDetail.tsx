import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/UI/Card';
import ReactMarkdown from 'react-markdown';
import { Book, Terminal, Flag, CheckCircle, Play, Square, RefreshCcw, ExternalLink, AlertTriangle } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ApiLab {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  short_description: string;
  long_description: string;
}

interface ApiChallenge {
  id: string;
  lab_template_id: string;
  title: string;
  description: string;
  points: number;
  is_solved: boolean;
  attempts_used: number;
}

interface ApiLabInstance {
  instance_id: string;
  lab_template_id: string;
  state: string;
  connection_url?: string | null;
  assigned_port?: number | null;
  last_error?: string | null;
}

interface SubmissionResult {
  challenge_id: string;
  result: string;
  points_earned: number;
  attempt_no: number;
}

const ModuleDetail: React.FC = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<'theory' | 'labs'>('theory');
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [instancesByLabId, setInstancesByLabId] = useState<Record<string, ApiLabInstance>>({});
  const [challengesByLabId, setChallengesByLabId] = useState<Record<string, ApiChallenge[]>>({});
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({});
  const [submitResults, setSubmitResults] = useState<Record<string, SubmissionResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyLabId, setBusyLabId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadInstances = async (): Promise<Record<string, ApiLabInstance>> => {
    const response = await apiClient.get<{ data: ApiLabInstance[] }>('/api/v1/me/lab-instances?limit=100');
    return response.data.reduce<Record<string, ApiLabInstance>>((acc, current) => {
      acc[current.lab_template_id] = current;
      return acc;
    }, {});
  };

  const loadChallenges = async (labId: string): Promise<ApiChallenge[]> => {
    const response = await apiClient.get<{ data: ApiChallenge[] }>(`/api/v1/labs/${labId}/challenges`);
    return response.data;
  };

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      let labsResponse = await apiClient.get<{ data: ApiLab[] }>(`/api/v1/labs?limit=50&search=${encodeURIComponent(slug ?? '')}`);
      if (!labsResponse.data.length) {
        labsResponse = await apiClient.get<{ data: ApiLab[] }>('/api/v1/labs?limit=50');
      }

      setLabs(labsResponse.data);

      const [instancesMap, challengesList] = await Promise.all([
        loadInstances(),
        Promise.all(labsResponse.data.map((lab) => loadChallenges(lab.id))),
      ]);

      setInstancesByLabId(instancesMap);
      const mergedChallenges = labsResponse.data.reduce<Record<string, ApiChallenge[]>>((acc, lab, index) => {
        acc[lab.id] = challengesList[index];
        return acc;
      }, {});
      setChallengesByLabId(mergedChallenges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module detail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [slug]);

  const handleStartLab = async (labId: string) => {
    setError('');
    setBusyLabId(labId);
    try {
      const instance = await apiClient.post<ApiLabInstance>(`/api/v1/labs/${labId}/start`);
      setInstancesByLabId((prev) => ({ ...prev, [labId]: instance }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start lab.');
    } finally {
      setBusyLabId(null);
    }
  };

  const handleStopLab = async (labId: string) => {
    const instance = instancesByLabId[labId];
    if (!instance) return;
    setError('');
    setBusyLabId(labId);
    try {
      const updated = await apiClient.post<ApiLabInstance>(`/api/v1/lab-instances/${instance.instance_id}/deactivate`);
      setInstancesByLabId((prev) => ({ ...prev, [labId]: updated }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop lab.');
    } finally {
      setBusyLabId(null);
    }
  };

  const handleRestartLab = async (labId: string) => {
    const instance = instancesByLabId[labId];
    if (!instance) return;
    setError('');
    setBusyLabId(labId);
    try {
      const updated = await apiClient.post<ApiLabInstance>(`/api/v1/lab-instances/${instance.instance_id}/restart`);
      setInstancesByLabId((prev) => ({ ...prev, [labId]: updated }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart lab.');
    } finally {
      setBusyLabId(null);
    }
  };

  const handleSubmitFlag = async (labId: string, challengeId: string) => {
    const submittedFlag = (flagInputs[challengeId] ?? '').trim();
    if (!submittedFlag) return;

    setError('');
    try {
      const result = await apiClient.post<SubmissionResult>(`/api/v1/challenges/${challengeId}/submit`, {
        flag: submittedFlag,
      });

      setSubmitResults((prev) => ({ ...prev, [challengeId]: result }));
      setFlagInputs((prev) => ({ ...prev, [challengeId]: '' }));
      const refreshedChallenges = await loadChallenges(labId);
      setChallengesByLabId((prev) => ({ ...prev, [labId]: refreshedChallenges }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit flag.');
    }
  };

  const theoryMarkdown = useMemo(() => {
    if (!labs.length) return '# Module\nNo theory available yet.';
    return labs[0].long_description || labs[0].short_description || '# Module';
  }, [labs]);

  if (isLoading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading module detail...</div>;
  }

  if (!labs.length) {
    return <div className="text-slate-800 dark:text-white">Module not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <div className="text-idn-500 font-bold text-sm font-mono mb-2">{(slug ?? labs[0].slug).toUpperCase()}</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{labs[0].title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{labs[0].short_description}</p>
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

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            {error}
          </div>
        </Card>
      )}

      <div className="min-h-[500px]">
        {activeTab === 'theory' ? (
          <Card className="prose prose-slate dark:prose-invert max-w-none p-8">
            <ReactMarkdown>{theoryMarkdown}</ReactMarkdown>
          </Card>
        ) : (
          <div className="space-y-8">
            {labs.map((lab) => {
              const instance = instancesByLabId[lab.id];
              const isRunning = instance?.state === 'ACTIVE' && !!instance?.connection_url;
              const challenges = challengesByLabId[lab.id] ?? [];
              const isBusy = busyLabId === lab.id;

              return (
                <div key={lab.id} className="space-y-6">
                  <Card className="border-t-4 border-t-idn-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                          <Terminal className="text-idn-500" />
                          {lab.title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                          Docker Environment • Isolated • {lab.difficulty}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {!isRunning ? (
                          <button
                            onClick={() => void handleStartLab(lab.id)}
                            disabled={isBusy}
                            className="flex items-center gap-2 bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-idn-500/20 disabled:opacity-70"
                          >
                            <Play size={18} /> {isBusy ? 'Starting...' : 'Start Lab'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => void handleRestartLab(lab.id)}
                              disabled={isBusy}
                              className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-70"
                            >
                              <RefreshCcw size={18} /> Restart
                            </button>
                            <button
                              onClick={() => void handleStopLab(lab.id)}
                              disabled={isBusy}
                              className="flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-70"
                            >
                              <Square size={18} /> Stop
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {instance?.connection_url && (
                      <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-sm">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">Target URL</div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-green-600 dark:text-green-400">{instance.connection_url}/</code>
                          <a
                            href={instance.connection_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-idn-600 hover:text-idn-700"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    )}
                  </Card>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Flag className="text-idn-500" /> Challenges
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {challenges.map((challenge) => (
                        <Card key={challenge.id} className={`border-l-4 ${challenge.is_solved ? 'border-l-green-500' : 'border-l-slate-400 dark:border-l-slate-600'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800 dark:text-white">{challenge.title}</h4>
                            <span className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                              {challenge.points} PTS
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{challenge.description}</p>

                          {challenge.is_solved ? (
                            <div className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-2 rounded text-sm flex items-center gap-2 font-bold">
                              <CheckCircle size={16} /> Challenge Solved
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter flag"
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm w-full focus:border-idn-500 outline-none text-slate-800 dark:text-white font-mono"
                                value={flagInputs[challenge.id] || ''}
                                onChange={(e) => setFlagInputs((prev) => ({ ...prev, [challenge.id]: e.target.value }))}
                              />
                              <button
                                onClick={() => void handleSubmitFlag(lab.id, challenge.id)}
                                className="bg-idn-500 hover:bg-idn-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm"
                              >
                                Submit
                              </button>
                            </div>
                          )}

                          {submitResults[challenge.id] && (
                            <div className="mt-3 text-xs text-slate-500">
                              Last submission: {submitResults[challenge.id].result} (attempt #{submitResults[challenge.id].attempt_no})
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;

