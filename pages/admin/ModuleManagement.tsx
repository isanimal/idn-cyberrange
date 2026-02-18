import React, { useEffect, useState } from 'react';
import Card from '../../components/UI/Card';
import { AdminLesson, AdminModule, AdminModuleLevel, AdminModuleStatus } from '../../types';
import { Edit2, Trash2, Plus, Lock, Unlock, Search, Save, X, BookOpen, Clock } from 'lucide-react';
import { ModuleLabLinkItem, adminModulesApi } from '../../services/adminModulesApi';
import { labService } from '../../features/labs/api/labService';
import { LabTemplate } from '../../features/labs/types';

const levelLabel: Record<AdminModuleLevel, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const ModuleManagement: React.FC = () => {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<AdminModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  const [lessonEditorTab, setLessonEditorTab] = useState<'content' | 'tasks' | 'assets'>('content');
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    content: '',
    order_index: 1,
  });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    order_index: 1,
    points: '',
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [assetFormData, setAssetFormData] = useState({
    url: '',
    caption: '',
    order_index: 1,
  });
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [selectedModuleForLabs, setSelectedModuleForLabs] = useState<AdminModule | null>(null);
  const [publishedLabs, setPublishedLabs] = useState<LabTemplate[]>([]);
  const [linkedLabs, setLinkedLabs] = useState<ModuleLabLinkItem[]>([]);
  const [selectedLabTemplateId, setSelectedLabTemplateId] = useState('');
  const [linkOrder, setLinkOrder] = useState(1);
  const [linkRequired, setLinkRequired] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    level: 'basic' as AdminModuleLevel,
    order_index: 1,
    status: 'locked' as AdminModuleStatus,
    tags: '',
  });

  const loadModules = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminModulesApi.list();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadModules();
  }, []);

  const loadLessons = async (moduleId: string) => {
    setError('');
    try {
      const data = await adminModulesApi.listLessons(moduleId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lessons.');
    }
  };

  const loadPublishedLabs = async () => {
    const labs = await labService.getAllLabsAdmin();
    setPublishedLabs(labs.filter((lab) => String(lab.status).toUpperCase() === 'PUBLISHED'));
  };

  const loadLinkedLabs = async (moduleId: string) => {
    const links = await adminModulesApi.listModuleLabLinks(moduleId);
    setLinkedLabs(links);
  };

  const handleEdit = (module: AdminModule) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      slug: module.slug,
      description: module.description,
      level: module.level,
      order_index: module.order_index,
      status: module.status,
      tags: '',
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingModule(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      level: 'basic',
      order_index: modules.length + 1,
      status: 'locked',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.remove(id);
      setModules((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (editingModule) {
        const updated = await adminModulesApi.update(editingModule.id, {
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          level: formData.level,
          status: formData.status,
          order_index: formData.order_index,
        });
        setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await adminModulesApi.create({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          level: formData.level,
          status: formData.status,
          order_index: formData.order_index,
        });
        setModules((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLock = async (module: AdminModule) => {
    setError('');
    setIsSubmitting(true);
    try {
      const nextStatus: AdminModuleStatus = module.status === 'locked' ? 'active' : 'locked';
      const updated = await adminModulesApi.update(module.id, { status: nextStatus });
      setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageContent = async (module: AdminModule) => {
    setSelectedModuleForLessons(module);
    setEditingLesson(null);
    setLessonEditorTab('content');
    setLessonFormData({ title: '', content: '', order_index: 1 });
    setTaskFormData({ title: '', order_index: 1, points: '' });
    setAssetFormData({ url: '', caption: '', order_index: 1 });
    setIsLessonModalOpen(true);
    await loadLessons(module.id);
  };

  const handleManageLabs = async (module: AdminModule) => {
    setSelectedModuleForLabs(module);
    setIsLabsModalOpen(true);
    setSelectedLabTemplateId('');
    setLinkOrder(1);
    setLinkRequired(false);
    setError('');
    setIsSubmitting(true);
    try {
      await Promise.all([loadPublishedLabs(), loadLinkedLabs(module.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForLabs || !selectedLabTemplateId) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.linkModuleLab(selectedModuleForLabs.id, {
        lab_template_id: selectedLabTemplateId,
        order: linkOrder,
        required: linkRequired,
        type: 'LAB',
      });
      setSelectedLabTemplateId('');
      setLinkOrder(linkedLabs.length + 1);
      setLinkRequired(false);
      await loadLinkedLabs(selectedModuleForLabs.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link lab.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkLab = async (linkId: string) => {
    if (!selectedModuleForLabs || !window.confirm('Unlink this lab from module?')) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.unlinkModuleLab(selectedModuleForLabs.id, linkId);
      await loadLinkedLabs(selectedModuleForLabs.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink lab.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLink = async (link: ModuleLabLinkItem, patch: Partial<Pick<ModuleLabLinkItem, 'order' | 'required'>>) => {
    if (!selectedModuleForLabs) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.linkModuleLab(selectedModuleForLabs.id, {
        lab_template_id: link.lab_template_id,
        order: patch.order ?? link.order,
        required: patch.required ?? link.required,
        type: link.type,
      });
      await loadLinkedLabs(selectedModuleForLabs.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lab link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForLessons) return;

    setError('');
    setIsSubmitting(true);
    try {
      if (editingLesson) {
        const updated = await adminModulesApi.updateLesson(selectedModuleForLessons.id, editingLesson.id, {
          title: lessonFormData.title,
          content: lessonFormData.content,
          order_index: lessonFormData.order_index,
        });
        setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setEditingLesson(updated);
      } else {
        const created = await adminModulesApi.createLesson(selectedModuleForLessons.id, {
          title: lessonFormData.title,
          content: lessonFormData.content,
          order_index: lessonFormData.order_index,
        });
        setLessons((prev) => [...prev, created]);
        setEditingLesson(created);
        setModules((prev) =>
          prev.map((m) => (m.id === selectedModuleForLessons.id ? { ...m, lessons_count: m.lessons_count + 1 } : m)),
        );
      }
      setLessonEditorTab('content');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLesson = async (lesson: AdminLesson) => {
    if (!selectedModuleForLessons) return;

    setError('');
    try {
      const detail = await adminModulesApi.getLesson(selectedModuleForLessons.id, lesson.id);
      setEditingLesson(detail);
      setLessonEditorTab('content');
      setLessonFormData({
        title: detail.title,
        content: detail.content,
        order_index: detail.order_index,
      });
      setTaskFormData({
        title: '',
        order_index: (detail.tasks?.length ?? 0) + 1,
        points: '',
      });
      setAssetFormData({
        url: '',
        caption: '',
        order_index: (detail.assets?.length ?? 0) + 1,
      });
      setAssetFile(null);
      setEditingTaskId(null);
      setEditingAssetId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson detail.');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedModuleForLessons || !window.confirm('Delete this lesson?')) return;

    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.removeLesson(selectedModuleForLessons.id, lessonId);
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      setModules((prev) =>
        prev.map((m) =>
          m.id === selectedModuleForLessons.id
            ? { ...m, lessons_count: Math.max(0, m.lessons_count - 1) }
            : m,
        ),
      );
      if (editingLesson?.id === lessonId) {
        setEditingLesson(null);
        setLessonFormData({ title: '', content: '', order_index: 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshEditingLesson = async () => {
    if (!selectedModuleForLessons || !editingLesson) return;

    const detail = await adminModulesApi.getLesson(selectedModuleForLessons.id, editingLesson.id);
    setEditingLesson(detail);
    setLessons((prev) => prev.map((l) => (l.id === detail.id ? detail : l)));
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        title: taskFormData.title,
        order_index: taskFormData.order_index,
        points: taskFormData.points ? Number(taskFormData.points) : undefined,
      };
      if (editingTaskId) {
        await adminModulesApi.updateTask(editingTaskId, payload);
      } else {
        await adminModulesApi.createTask(editingLesson.id, payload);
      }
      setTaskFormData({ title: '', order_index: (editingLesson.tasks?.length ?? 0) + 1, points: '' });
      setEditingTaskId(null);
      await refreshEditingLesson();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.removeTask(taskId);
      await refreshEditingLesson();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    if (!assetFile && !assetFormData.url.trim()) {
      setError('Provide an image URL or choose a file.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'IMAGE' as const,
        url: assetFormData.url,
        caption: assetFormData.caption || undefined,
        order_index: assetFormData.order_index,
      };
      if (editingAssetId && assetFile) {
        const updateForm = new FormData();
        updateForm.append('file', assetFile);
        updateForm.append('type', 'IMAGE');
        updateForm.append('order_index', String(assetFormData.order_index));
        if (assetFormData.caption) {
          updateForm.append('caption', assetFormData.caption);
        }
        await adminModulesApi.updateAsset(editingAssetId, updateForm);
      } else if (editingAssetId) {
        await adminModulesApi.updateAsset(editingAssetId, payload);
      } else if (assetFile) {
        await adminModulesApi.uploadAsset(editingLesson.id, {
          type: 'IMAGE',
          file: assetFile,
          caption: assetFormData.caption || undefined,
          order_index: assetFormData.order_index,
        });
      } else {
        await adminModulesApi.createAsset(editingLesson.id, payload);
      }
      setAssetFormData({ url: '', caption: '', order_index: (editingLesson.assets?.length ?? 0) + 1 });
      setAssetFile(null);
      setEditingAssetId(null);
      await refreshEditingLesson();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('Delete this asset?')) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminModulesApi.removeAsset(assetId);
      await refreshEditingLesson();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const currentModuleLessons = lessons.sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Module Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Create, update, and organize training content.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Module
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 max-w-md">
            <Search className="text-slate-400 ml-2" size={20} />
            <input
              type="text"
              placeholder="Search modules..."
              className="bg-transparent border-none outline-none text-slate-800 dark:text-white px-4 py-1 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-sm text-slate-500">Loading modules...</td>
                </tr>
              ) : filteredModules.map((module) => (
                <tr key={module.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-500">#{module.order_index}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">{module.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{module.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => void handleManageContent(module)}
                      className="flex items-center gap-2 text-xs font-bold text-idn-600 dark:text-idn-400 hover:underline"
                    >
                      <BookOpen size={14} />
                      {module.lessons_count} Lessons
                    </button>
                    <button
                      onClick={() => void handleManageLabs(module)}
                      className="mt-2 flex items-center gap-2 text-xs font-bold text-idn-600 dark:text-idn-400 hover:underline"
                    >
                      <Clock size={14} />
                      Manage Labs
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      module.level === 'basic' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      module.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {levelLabel[module.level]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => void toggleLock(module)}
                      disabled={isSubmitting}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors ${
                        module.status === 'locked'
                          ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
                          : 'border-green-200 bg-green-50 text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400'
                      }`}
                    >
                      {module.status === 'locked' ? <><Lock size={12} /> Locked</> : <><Unlock size={12} /> Active</>}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(module)}
                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Edit Module Metadata"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => void handleDelete(module.id)}
                        className="p-1.5 bg-slate-100 text-red-500 hover:bg-red-100 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="text-idn-500" />
                {editingModule ? 'Edit Module Metadata' : 'Create New Module'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form id="moduleForm" onSubmit={(e) => void handleSave(e)} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Slug (URL Friendly)</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none font-mono text-sm"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Difficulty Level</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as AdminModuleLevel })}
                  >
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Status</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AdminModuleStatus })}
                  >
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Tags (Comma Sep)</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="moduleForm"
                disabled={isSubmitting}
                className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-idn-500/20 disabled:opacity-70"
              >
                <Save size={18} /> Save Module
              </button>
            </div>
          </div>
        </div>
      )}

      {isLessonModalOpen && selectedModuleForLessons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-5xl shadow-2xl flex flex-col h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="text-idn-500" />
                  Manage Content: {selectedModuleForLessons.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Add, edit, or remove learning materials for this module.</p>
              </div>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">Lessons</h4>
                  <button
                    onClick={() => {
                      setEditingLesson(null);
                      setLessonFormData({ title: '', content: '', order_index: currentModuleLessons.length + 1 });
                    }}
                    className="text-xs bg-idn-500 text-white px-2 py-1 rounded hover:bg-idn-600 flex items-center gap-1"
                  >
                    <Plus size={12} /> New
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {currentModuleLessons.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 text-sm">No lessons yet. Click "New" to create one.</div>
                  ) : (
                    currentModuleLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => void handleEditLesson(lesson)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          editingLesson?.id === lesson.id
                            ? 'bg-white dark:bg-slate-800 border-idn-500 shadow-md'
                            : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-sm text-slate-800 dark:text-white">{lesson.title}</h5>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteLesson(lesson.id);
                            }}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Clock size={10} /> Order #{lesson.order_index}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="w-2/3 flex flex-col bg-white dark:bg-slate-800">
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-white">
                      {editingLesson ? `Edit Lesson: ${editingLesson.title}` : 'Create New Lesson'}
                    </h4>
                    <div className="flex gap-2">
                      {(['content', 'tasks', 'assets'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setLessonEditorTab(tab)}
                          className={`px-3 py-1.5 text-xs rounded-md font-semibold ${lessonEditorTab === tab ? 'bg-idn-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                        >
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {lessonEditorTab === 'content' && (
                    <form id="lessonForm" onSubmit={(e) => void handleSaveLesson(e)} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Lesson Title</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                            value={lessonFormData.title}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Order</label>
                          <input
                            type="number"
                            min={1}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                            value={lessonFormData.order_index}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, order_index: Number(e.target.value) || 1 })}
                          />
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col h-full">
                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">
                          Content (Markdown Supported)
                        </label>
                        <textarea
                          required
                          className="w-full flex-1 min-h-[300px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-800 dark:text-white focus:border-idn-500 outline-none resize-none leading-relaxed"
                          placeholder="# Lesson Header&#10;Write your learning content here..."
                          value={lessonFormData.content}
                          onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                        />
                      </div>
                    </form>
                  )}

                  {lessonEditorTab === 'tasks' && (
                    <div className="space-y-4">
                      {!editingLesson ? (
                        <div className="text-sm text-slate-500">Select or create a lesson first.</div>
                      ) : (
                        <>
                          <form id="taskForm" onSubmit={(e) => void handleSaveTask(e)} className="grid grid-cols-12 gap-3">
                            <input
                              className="col-span-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white"
                              placeholder="Task title"
                              value={taskFormData.title}
                              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                              required
                            />
                            <input
                              type="number"
                              min={1}
                              className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white"
                              value={taskFormData.order_index}
                              onChange={(e) => setTaskFormData({ ...taskFormData, order_index: Number(e.target.value) || 1 })}
                              required
                            />
                            <input
                              type="number"
                              min={0}
                              className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white"
                              placeholder="Points"
                              value={taskFormData.points}
                              onChange={(e) => setTaskFormData({ ...taskFormData, points: e.target.value })}
                            />
                            <button className="col-span-2 bg-idn-500 text-white text-sm rounded-lg font-semibold">
                              {editingTaskId ? 'Update' : 'Add'}
                            </button>
                          </form>

                          <div className="space-y-2">
                            {(editingLesson.tasks ?? []).length === 0 ? (
                              <div className="text-sm text-slate-500">No tasks yet.</div>
                            ) : (
                              (editingLesson.tasks ?? []).slice().sort((a, b) => a.order_index - b.order_index).map((task) => (
                                <div key={task.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                  <div className="text-sm text-slate-700 dark:text-slate-300">
                                    #{task.order_index} {task.title}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTaskId(task.id);
                                        setTaskFormData({
                                          title: task.title,
                                          order_index: task.order_index,
                                          points: task.points?.toString() ?? '',
                                        });
                                      }}
                                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteTask(task.id)}
                                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {lessonEditorTab === 'assets' && (
                    <div className="space-y-4">
                      {!editingLesson ? (
                        <div className="text-sm text-slate-500">Select or create a lesson first.</div>
                      ) : (
                        <>
                          <form id="assetForm" onSubmit={(e) => void handleSaveAsset(e)} className="grid grid-cols-12 gap-3">
                            <input
                              className="col-span-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white"
                              placeholder="Image URL (optional if upload file)"
                              value={assetFormData.url}
                              onChange={(e) => setAssetFormData({ ...assetFormData, url: e.target.value })}
                            />
                            <input
                              className="col-span-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white"
                              placeholder="Caption"
                              value={assetFormData.caption}
                              onChange={(e) => setAssetFormData({ ...assetFormData, caption: e.target.value })}
                            />
                            <input
                              type="number"
                              min={1}
                              className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-white"
                              value={assetFormData.order_index}
                              onChange={(e) => setAssetFormData({ ...assetFormData, order_index: Number(e.target.value) || 1 })}
                              required
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="col-span-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300"
                              onChange={(e) => {
                                setAssetFile(e.target.files?.[0] ?? null);
                                if (e.target.files?.[0]) {
                                  setAssetFormData((prev) => ({ ...prev, url: '' }));
                                }
                              }}
                            />
                            <div className="col-span-12 text-xs text-slate-500 dark:text-slate-400">
                              Use either image URL or upload file.
                            </div>
                            <button className="col-span-12 bg-idn-500 text-white text-sm rounded-lg font-semibold py-2">
                              {editingAssetId ? 'Update Asset' : 'Add Asset'}
                            </button>
                          </form>

                          <div className="grid grid-cols-2 gap-3">
                            {(editingLesson.assets ?? []).length === 0 ? (
                              <div className="text-sm text-slate-500 col-span-2">No assets yet.</div>
                            ) : (
                              (editingLesson.assets ?? []).slice().sort((a, b) => a.order_index - b.order_index).map((asset) => (
                                <div key={asset.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                  <img src={asset.url} alt={asset.caption ?? 'asset'} className="w-full h-24 object-cover" />
                                  <div className="p-2 text-xs text-slate-600 dark:text-slate-300">{asset.caption || 'Image'}</div>
                                  <div className="p-2 flex justify-between">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAssetId(asset.id);
                                        setAssetFormData({
                                          url: asset.url,
                                          caption: asset.caption ?? '',
                                          order_index: asset.order_index,
                                        });
                                        setAssetFile(null);
                                      }}
                                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteAsset(asset.id)}
                                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setIsLessonModalOpen(false)}
                    className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type={lessonEditorTab === 'content' ? 'submit' : 'button'}
                    form={lessonEditorTab === 'content' ? 'lessonForm' : undefined}
                    onClick={() => {
                      if (lessonEditorTab === 'tasks') {
                        const form = document.getElementById('taskForm') as HTMLFormElement | null;
                        form?.requestSubmit();
                      }
                      if (lessonEditorTab === 'assets') {
                        const form = document.getElementById('assetForm') as HTMLFormElement | null;
                        form?.requestSubmit();
                      }
                    }}
                    disabled={isSubmitting}
                    className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70"
                  >
                    <Save size={18} />
                    {lessonEditorTab === 'content' ? (editingLesson ? 'Update Lesson' : 'Add Lesson') : lessonEditorTab === 'tasks' ? (editingTaskId ? 'Update Task' : 'Add Task') : (editingAssetId ? 'Update Asset' : 'Add Asset')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLabsModalOpen && selectedModuleForLabs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Manage Module Labs: {selectedModuleForLabs.title}</h3>
              <button onClick={() => setIsLabsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <form onSubmit={(e) => void handleLinkLab(e)} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Published Lab Template</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white"
                    value={selectedLabTemplateId}
                    onChange={(e) => setSelectedLabTemplateId(e.target.value)}
                    required
                  >
                    <option value="">Select lab...</option>
                    {publishedLabs.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.title} ({lab.difficulty})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Order</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white"
                    value={linkOrder}
                    onChange={(e) => setLinkOrder(Number(e.target.value) || 1)}
                  />
                </div>
                <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={linkRequired}
                    onChange={(e) => setLinkRequired(e.target.checked)}
                  />
                  Required
                </label>
                <button className="col-span-2 bg-idn-500 text-white rounded-lg py-2.5 font-semibold disabled:opacity-60" disabled={isSubmitting}>
                  Link
                </button>
              </form>

              <div className="space-y-2">
                {linkedLabs.length === 0 ? (
                  <div className="text-sm text-slate-500">No labs linked to this module yet.</div>
                ) : (
                  linkedLabs
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((link) => (
                      <div key={link.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{link.lab_template?.title ?? link.lab_template_id}</div>
                          <div className="text-xs text-slate-500">
                            {link.lab_template?.difficulty ?? '-'} • {link.lab_template?.est_minutes ?? 0}m • {link.required ? 'Required' : 'Optional'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-sm"
                            value={link.order}
                            onChange={(e) => void handleUpdateLink(link, { order: Number(e.target.value) || 1 })}
                          />
                          <label className="text-xs flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={link.required}
                              onChange={(e) => void handleUpdateLink(link, { required: e.target.checked })}
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleUnlinkLab(link.id)}
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleManagement;
