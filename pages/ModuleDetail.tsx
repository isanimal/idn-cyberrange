import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/UI/Card';
import ReactMarkdown from 'react-markdown';
import { Book, Terminal, Lock, Unlock, CheckCircle2, ExternalLink, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { LessonDetail, LessonSummary, ModuleDetail as ModuleDetailDTO, ModuleLabSummary } from '../types';
import { modulesApi } from '../services/modulesApi';
import { labService } from '../features/labs/api/labService';
import { LabInstance } from '../features/labs/types';

type LabModalTab = 'overview' | 'logs' | 'env' | 'resources';

type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

const statusPillClass: Record<LessonStatus, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
};

const statusLabel: Record<LessonStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const ModuleDetail: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<'theory' | 'labs'>('theory');
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonDetail | null>(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [startingLabId, setStartingLabId] = useState<string | null>(null);
  const [instanceModal, setInstanceModal] = useState<LabInstance | null>(null);
  const [modalTab, setModalTab] = useState<LabModalTab>('overview');
  const [activeAssetUrl, setActiveAssetUrl] = useState<string | null>(null);
  const readingTimerRef = useRef<number | null>(null);

  const loadModule = useCallback(async () => {
    if (!slug) {
      return;
    }

    setIsLoading(true);
    setError('');
    setLockedMessage(null);

    try {
      const data = await modulesApi.getModule(slug);
      setModuleDetail(data);
      if (data.lessons.length > 0) {
        const resumeLesson = data.resume_lesson_id
          ? data.lessons.find((lesson) => lesson.id === data.resume_lesson_id)
          : null;
        const inProgress = data.lessons.find((lesson) => (lesson.status ?? 'NOT_STARTED') === 'IN_PROGRESS');
        const firstNotDone = data.lessons.find((lesson) => !(lesson.is_completed || lesson.status === 'COMPLETED'));
        const fallback = resumeLesson ?? inProgress ?? firstNotDone ?? data.lessons[0];
        setSelectedLessonId((prev) => prev ?? fallback.id);
      } else {
        setSelectedLessonId(null);
        setCurrentLesson(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load module detail.';
      if (message.toLowerCase().includes('locked')) {
        setLockedMessage('This module is locked. Complete the previous module to unlock it.');
        setError('');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  const loadLesson = useCallback(async (lessonId: string) => {
    if (!slug) {
      return;
    }

    setIsLessonLoading(true);
    try {
      const lesson = await modulesApi.getLesson(slug, lessonId);
      setCurrentLesson(lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson detail.');
    } finally {
      setIsLessonLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadModule();
  }, [loadModule]);

  useEffect(() => {
    if (!selectedLessonId) {
      return;
    }

    void loadLesson(selectedLessonId);
  }, [selectedLessonId, loadLesson]);

  useEffect(() => {
    if (!currentLesson || currentLesson.is_completed) {
      return;
    }

    void modulesApi.readingEvent(currentLesson.id, { event: 'OPEN', percentViewed: currentLesson.percent ?? 0 }).catch(() => {});
  }, [currentLesson]);

  useEffect(() => {
    if (!currentLesson || currentLesson.is_completed) {
      return;
    }

    if (readingTimerRef.current) {
      window.clearTimeout(readingTimerRef.current);
    }

    readingTimerRef.current = window.setTimeout(() => {
      void modulesApi.readingEvent(currentLesson.id, {
        event: 'HEARTBEAT',
        percentViewed: Math.max(35, currentLesson.percent ?? 0),
      }).then(async () => {
        await loadModule();
        await loadLesson(currentLesson.id);
      }).catch(() => {});
    }, 12000);

    return () => {
      if (readingTimerRef.current) {
        window.clearTimeout(readingTimerRef.current);
      }
    };
  }, [currentLesson, loadModule]);

  const sortedLessons = useMemo(
    () => [...(moduleDetail?.lessons ?? [])].sort((a, b) => a.order - b.order),
    [moduleDetail?.lessons],
  );
  const selectedLessonIndex = sortedLessons.findIndex((lesson) => lesson.id === selectedLessonId);
  const selectedLessonSummary = selectedLessonIndex >= 0 ? sortedLessons[selectedLessonIndex] : null;
  const moduleLabs = moduleDetail?.labs ?? [];

  const onCompleteLesson = async (lesson: LessonSummary) => {
    if (lesson.is_completed) {
      return;
    }

    try {
      setCompletingLessonId(lesson.id);
      await modulesApi.completeLessonById(lesson.id);
      await loadModule();
      await loadLesson(lesson.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete lesson.');
    } finally {
      setCompletingLessonId(null);
    }
  };

  const onToggleTask = async (taskId: string) => {
    if (!currentLesson) return;

    try {
      await modulesApi.toggleTask(taskId);
      await loadModule();
      await loadLesson(currentLesson.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task.');
    }
  };

  const gotoPrevLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonId(sortedLessons[selectedLessonIndex - 1].id);
    }
  };

  const gotoNextLesson = () => {
    if (selectedLessonIndex >= 0 && selectedLessonIndex < sortedLessons.length - 1) {
      setSelectedLessonId(sortedLessons[selectedLessonIndex + 1].id);
    }
  };

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

  if (lockedMessage) {
    return (
      <Card>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
            <Lock size={16} /> Module Locked
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{lockedMessage}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/modules')}
              className="px-3 py-2 rounded-md text-sm font-semibold bg-idn-500 text-white"
            >
              Back to Modules
            </button>
            <Link to="/modules" className="px-3 py-2 rounded-md text-sm font-semibold border border-slate-300 text-slate-600">
              View Prerequisites
            </Link>
          </div>
        </div>
      </Card>
    );
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
            {moduleDetail.resume_lesson_id ? (
              <>
                <span>•</span>
                <span>Continue where you left off</span>
              </>
            ) : null}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-4 xl:col-span-3 max-h-[680px] overflow-y-auto">
              <div className="space-y-2">
                {sortedLessons.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No lessons available yet.</div>
                ) : (
                  sortedLessons.map((lesson) => {
                    const status = (lesson.status ?? (lesson.is_completed ? 'COMPLETED' : 'NOT_STARTED')) as LessonStatus;
                    const isActive = lesson.id === selectedLessonId;

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`w-full text-left border rounded-lg p-3 transition ${isActive ? 'border-idn-500 bg-idn-50/60 dark:bg-idn-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-idn-300'}`}
                      >
                        <div className="text-[11px] text-slate-500 mb-1">Lesson {lesson.order}</div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">{lesson.title}</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`text-[11px] px-2 py-1 rounded-full ${statusPillClass[status]}`}>
                            {statusLabel[status]}
                          </span>
                          <span className="text-[11px] text-slate-500">{lesson.percent ?? (lesson.is_completed ? 100 : 0)}%</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="lg:col-span-8 xl:col-span-9 max-w-none p-6 flex flex-col min-h-[680px]">
              {!selectedLessonSummary ? (
                <div className="text-slate-500 dark:text-slate-400">Select a lesson to start.</div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Lesson {selectedLessonSummary.order}</div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedLessonSummary.title}</h2>
                    </div>
                    <button
                      type="button"
                      disabled={selectedLessonSummary.is_completed || completingLessonId === selectedLessonSummary.id}
                      onClick={() => void onCompleteLesson(selectedLessonSummary)}
                      className="text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-60"
                    >
                      {selectedLessonSummary.is_completed ? (
                        <span className="inline-flex items-center gap-1"><CheckCircle2 size={14} /> Completed</span>
                      ) : completingLessonId === selectedLessonSummary.id ? 'Saving...' : 'Mark Completed'}
                    </button>
                  </div>

                  <div className="prose prose-slate dark:prose-invert max-w-none mt-4 flex-1 overflow-y-auto">
                    {isLessonLoading ? (
                      <div className="text-slate-500">Loading lesson content...</div>
                    ) : (
                      <ReactMarkdown skipHtml>{currentLesson?.content_md || selectedLessonSummary.content_md || 'Content is not available yet.'}</ReactMarkdown>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Tasks</h3>
                      {(currentLesson?.tasks?.length ?? 0) === 0 ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">No tasks for this lesson.</div>
                      ) : (
                        <div className="space-y-2">
                          {currentLesson?.tasks?.map((task) => (
                            <label key={task.id} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-idn-500 focus:ring-idn-500"
                                checked={Boolean(task.is_done)}
                                onChange={() => void onToggleTask(task.id)}
                              />
                              <span>{task.title}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <ImageIcon size={14} /> Resources
                      </h3>
                      {(currentLesson?.assets?.length ?? 0) === 0 ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">No images attached yet.</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {currentLesson?.assets?.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => setActiveAssetUrl(asset.url)}
                              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-left"
                            >
                              <img src={asset.url} alt={asset.caption ?? 'Lesson asset'} className="w-full h-24 object-cover" />
                              <div className="p-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{asset.caption || 'Image'}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between sticky bottom-0 bg-white dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={gotoPrevLesson}
                      disabled={selectedLessonIndex <= 0}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={gotoNextLesson}
                      disabled={selectedLessonIndex < 0 || selectedLessonIndex >= sortedLessons.length - 1}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>
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

      {activeAssetUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4" onClick={() => setActiveAssetUrl(null)}>
          <img src={activeAssetUrl} alt="Lesson asset preview" className="max-w-full max-h-full rounded-lg border border-slate-700" />
        </div>
      )}
    </div>
  );
};

export default ModuleDetail;
