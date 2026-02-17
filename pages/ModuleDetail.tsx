import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/UI/Card';
import ReactMarkdown from 'react-markdown';
import { Book, Terminal, Lock, Unlock, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { LessonSummary, ModuleDetail as ModuleDetailDTO, ModuleLabSummary } from '../types';
import { modulesApi } from '../services/modulesApi';
import { labService } from '../features/labs/api/labService';
import { LabInstance } from '../features/labs/types';

type LabModalTab = 'overview' | 'logs' | 'env' | 'resources';

const ModuleDetail: React.FC = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<'theory' | 'labs'>('theory');
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [startingLabId, setStartingLabId] = useState<string | null>(null);
  const [instanceModal, setInstanceModal] = useState<LabInstance | null>(null);
  const [modalTab, setModalTab] = useState<LabModalTab>('overview');

  const loadModule = useCallback(async () => {
    if (!slug) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await modulesApi.getModule(slug);
      setModuleDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module detail.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadModule();
  }, [loadModule]);

  const onCompleteLesson = async (lesson: LessonSummary) => {
    if (!slug || lesson.is_completed) {
      return;
    }

    try {
      setCompletingLessonId(lesson.id);
      await modulesApi.completeLesson(slug, lesson.id);
      await loadModule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete lesson.');
    } finally {
      setCompletingLessonId(null);
    }
  };

  const sortedLessons = useMemo(
    () => [...(moduleDetail?.lessons ?? [])].sort((a, b) => a.order - b.order),
    [moduleDetail?.lessons],
  );
  const moduleLabs = moduleDetail?.labs ?? [];

  const startOrResumeLab = async (lab: ModuleLabSummary) => {
    if (!lab.lab_template_id) {
      return;
    }

    try {
      setStartingLabId(lab.lab_template_id);

      let instance: LabInstance;
      if (lab.instance_id && lab.status_for_user !== 'RUNNING') {
        instance = await labService.restartLab(lab.instance_id);
      } else if (lab.instance_id && lab.status_for_user === 'RUNNING') {
        instance = await labService.getInstance(lab.instance_id);
      } else {
        instance = await labService.activateLab(lab.lab_template_id);
      }

      setInstanceModal(instance);
      setModalTab('overview');
      await loadModule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start lab.');
    } finally {
      setStartingLabId(null);
    }
  };

  if (isLoading) {
    return <div className="text-slate-600 dark:text-slate-300">Loading module detail...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!moduleDetail) {
    return <div className="text-slate-800 dark:text-white">Module not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <div className="text-idn-500 font-bold text-sm font-mono mb-2">{moduleDetail.difficulty}</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{moduleDetail.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{moduleDetail.description ?? 'No description yet.'}</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
            <span>Progress: {moduleDetail.progress_percent}%</span>
            <span>•</span>
            <span>{sortedLessons.length} lessons</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {moduleDetail.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
              {moduleDetail.is_locked ? 'Locked' : 'Active'}
            </span>
          </div>
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

      <div className="min-h-[500px]">
        {activeTab === 'theory' ? (
          <Card className="max-w-none p-8">
            <div className="space-y-4">
              {sortedLessons.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400">No lessons available yet.</div>
              ) : (
                sortedLessons.map((lesson) => (
                  <div key={lesson.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Lesson {lesson.order}</div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{lesson.title}</h3>
                      </div>
                      <button
                        type="button"
                        disabled={lesson.is_completed || completingLessonId === lesson.id}
                        onClick={() => void onCompleteLesson(lesson)}
                        className="text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-60"
                      >
                        {lesson.is_completed ? (
                          <span className="inline-flex items-center gap-1"><CheckCircle2 size={14} /> Completed</span>
                        ) : completingLessonId === lesson.id ? 'Saving...' : 'Mark Complete'}
                      </button>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none mt-3">
                      <ReactMarkdown>{lesson.content_md || 'Content is not available yet.'}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-3 text-slate-500 dark:text-slate-400">
              {moduleLabs.length === 0 ? (
                <div className="text-sm">No labs linked to this module yet.</div>
              ) : (
                <div className="space-y-3">
                  {moduleLabs.map((lab) => (
                    <div key={`${lab.lab_template_id}-${lab.type}`} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{lab.title}</div>
                          <div className="text-xs mt-1">
                            {lab.type} • {lab.difficulty} • {lab.est_minutes}m • {lab.required ? 'Required' : 'Optional'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void startOrResumeLab(lab)}
                          disabled={startingLabId === lab.lab_template_id}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-idn-500 text-white hover:bg-idn-600 disabled:opacity-60"
                        >
                          {startingLabId === lab.lab_template_id
                            ? 'Starting...'
                            : lab.status_for_user === 'RUNNING'
                              ? 'Resume'
                              : 'Start'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

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
                  onClick={() => setModalTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${modalTab === tab ? 'bg-idn-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-4 text-sm text-slate-700 dark:text-slate-300 min-h-[220px]">
              {modalTab === 'overview' && (
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
              {modalTab === 'logs' && <div className="text-slate-500">Logs endpoint not implemented yet.</div>}
              {modalTab === 'env' && <div className="text-slate-500">Environment values are masked by backend and will appear here when provided.</div>}
              {modalTab === 'resources' && <div className="text-slate-500">Resources snapshot shown in orchestration; timeseries soon.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDetail;
