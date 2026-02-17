import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/UI/Card';
import ReactMarkdown from 'react-markdown';
import { Book, Terminal, Lock, Unlock } from 'lucide-react';
import { UserModuleDetailDTO } from '../types';
import { modulesApi } from '../services/modulesApi';

const ModuleDetail: React.FC = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<'theory' | 'labs'>('theory');
  const [moduleDetail, setModuleDetail] = useState<UserModuleDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await modulesApi.detail(slug);
        setModuleDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load module detail.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [slug]);

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
          <div className="text-idn-500 font-bold text-sm font-mono mb-2">{moduleDetail.level}</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{moduleDetail.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{moduleDetail.description ?? 'No description yet.'}</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
            <span>Progress: {moduleDetail.progress_percent}%</span>
            <span>•</span>
            <span>{moduleDetail.lessons.length} lessons</span>
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
          <Card className="prose prose-slate dark:prose-invert max-w-none p-8">
            <ReactMarkdown>{moduleDetail.guide_markdown || '# Module Guide\n\nContent is not available yet.'}</ReactMarkdown>
            {moduleDetail.lessons.length > 0 && (
              <div className="mt-8">
                <h3>Lessons</h3>
                <ul>
                  {moduleDetail.lessons.map((lesson) => (
                    <li key={lesson.id}>{lesson.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="text-slate-500">
              Labs and challenges integration is available separately. This page now uses real module data from DB and is safe to open.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;

