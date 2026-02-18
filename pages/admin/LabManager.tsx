import React, { useState } from 'react';
import Card from '../../components/UI/Card';
import { useAdminLabs, useAdminLabMutations } from '../../features/labs/hooks/useLabs';
import { LabTemplate, LabDifficulty, LabStatus } from '../../features/labs/types';
import { 
  Plus, Archive, FileText, Upload, Trash2, Edit2, 
  X, AlertTriangle, Search, Server, Code
} from 'lucide-react';

const PORT_PLACEHOLDER = '${PORT}';

const LabManager: React.FC = () => {
  const { data: labs, isLoading, refetch } = useAdminLabs();
  const { 
    createLab, updateLab, publishLab, archiveLab, deleteLab, isSubmitting 
  } = useAdminLabMutations(refetch);

  // Modal States
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabTemplate | null>(null);
  const [deletingLab, setDeletingLab] = useState<LabTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form States
  const [activeTab, setActiveTab] = useState<'info' | 'config'>('info');
  const [formData, setFormData] = useState<Partial<LabTemplate>>({});
  const [configData, setConfigData] = useState({ content: '', base_port: 80 });
  const [publishData, setPublishData] = useState({ version: '', notes: '' });
  const [search, setSearch] = useState('');

  // --- HANDLERS ---

  const handleCreate = () => {
    setEditingLab(null);
    setActiveTab('info');
    setFormData({
      title: '',
      slug: '',
      difficulty: LabDifficulty.EASY,
      category: 'Web',
      estimated_time_minutes: 60,
      short_description: '',
      long_description: '# New Lab\n\nStart writing...',
      tags: []
    });
    setConfigData({
      content: `version: '3'\nservices:\n  app:\n    image: nginx:latest\n    ports:\n      - "${PORT_PLACEHOLDER}:80"`,
      base_port: 80
    });
    setEditorOpen(true);
  };

  const handleEdit = (lab: LabTemplate) => {
    setEditingLab(lab);
    setActiveTab('info');
    setFormData({ ...lab });
    if (lab.configuration) {
        setConfigData({ 
            content: lab.configuration.content, 
            base_port: lab.configuration.base_port 
        });
    } else {
        setConfigData({
            content: `version: '3'\nservices:\n  app:\n    image: nginx:latest\n    ports:\n      - "${PORT_PLACEHOLDER}:80"`,
            base_port: 80
        });
    }
    setEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingLab && activeTab === 'info') {
      const created = await createLab({
        ...formData,
        version: formData.version || '0.1.0',
        status: LabStatus.DRAFT,
      });
      setEditingLab(created);
      setFormData({ ...created });
      setActiveTab('config');
      return;
    }

    if (editingLab && activeTab === 'info') {
      await updateLab(editingLab.id, {
        ...formData,
      });
      setEditorOpen(false);
      return;
    }

    const finalData = {
      ...formData,
      configuration: {
        type: 'docker-compose' as const,
        content: configData.content,
        base_port: configData.base_port,
      },
    };

    if (editingLab) {
      await updateLab(editingLab.id, finalData);
    } else {
      await createLab({
        ...finalData,
        version: formData.version || '0.1.0',
        status: LabStatus.DRAFT,
      });
    }
    setEditorOpen(false);
  };

  const handlePublishClick = (lab: LabTemplate) => {
    setEditingLab(lab);
    // Suggest next version (very basic semver bump)
    const parts = lab.version.split('.').map(Number);
    if(parts.length === 3) parts[2]++; // Bump patch
    setPublishData({ version: parts.join('.') || '1.0.0', notes: '' });
    setPublishOpen(true);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab) return;
    await publishLab(editingLab.id, publishData.version, publishData.notes);
    setPublishOpen(false);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this lab? It will no longer be visible to users.')) {
      await archiveLab(id);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const openDeleteModal = (lab: LabTemplate) => {
    setDeletingLab(lab);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLab || isSubmitting) {
      return;
    }

    try {
      await deleteLab(deletingLab.id);
      setDeleteOpen(false);
      setDeletingLab(null);
      showToast('success', `Lab "${deletingLab.title}" deleted successfully.`);
    } catch (err) {
      const fallback = err instanceof Error ? err.message : 'Failed to delete lab template.';
      setDeleteError(fallback);
      showToast('error', fallback);
    }
  };

  const filteredLabs = labs.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lab Management</h1>
          <p className="text-slate-500 text-sm">Create and version control your lab templates.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-idn-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-idn-500/20 hover:bg-idn-600 transition-colors"
        >
          <Plus size={18} /> Create New Draft
        </button>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search labs..." 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 outline-none focus:border-idn-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-900">
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Difficulty</th>
                <th className="py-3 px-6">Version</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                 <tr><td colSpan={5} className="p-6 text-center text-slate-500">Loading templates...</td></tr>
              ) : filteredLabs.length === 0 ? (
                 <tr><td colSpan={5} className="p-6 text-center text-slate-500">No labs found.</td></tr>
              ) : (
                filteredLabs.map(lab => (
                  <tr key={lab.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-white">{lab.title}</div>
                      <div className="text-xs text-slate-500 flex gap-2 items-center">
                        <span className="font-mono">{lab.slug}</span>
                        {lab.updated_at && <span>• Updated {new Date(lab.updated_at).toLocaleDateString()}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          lab.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                          lab.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                       }`}>
                         {lab.difficulty}
                       </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm">{lab.version}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        lab.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800' :
                        lab.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' :
                        'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900'
                      }`}>
                        {lab.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(lab)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-idn-500 transition-colors" 
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        {lab.status !== LabStatus.ARCHIVED && (
                          <button 
                            onClick={() => handlePublishClick(lab)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-green-600 transition-colors" 
                            title="Publish New Version"
                          >
                            <Upload size={16} />
                          </button>
                        )}

                        <button 
                          onClick={() => openDeleteModal(lab)}
                          disabled={isSubmitting}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>

                        {lab.status !== LabStatus.ARCHIVED && (
                          <button 
                            onClick={() => handleArchive(lab.id)}
                            className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded text-slate-500 hover:text-yellow-600 transition-colors" 
                            title="Archive"
                          >
                            <Archive size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Modal */}
      {deleteOpen && deletingLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-xl shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                Delete Lab Template
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                You are deleting <span className="font-semibold text-slate-700 dark:text-slate-200">{deletingLab.title}</span> version{' '}
                <span className="font-mono">{deletingLab.version}</span>.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Delete this template? Existing lab instances will remain but template won&apos;t appear in catalog.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  if (isSubmitting) return;
                  setDeleteOpen(false);
                  setDeletingLab(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg shadow-lg shadow-red-600/20"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingLab ? 'Edit Lab Template' : 'Create Draft Template'}
              </h3>
              <button onClick={() => setEditorOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 bg-slate-50 dark:bg-slate-900/50">
               <button 
                 onClick={() => setActiveTab('info')}
                 className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                   activeTab === 'info' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                 }`}
               >
                 <FileText size={16} /> Information
               </button>
               <button 
                 onClick={() => setActiveTab('config')}
                 className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                   activeTab === 'config' ? 'border-idn-500 text-idn-600 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                 }`}
               >
                 <Server size={16} /> Configuration (Docker)
               </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col">
               {/* INFO TAB */}
               {activeTab === 'info' && (
                   <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Lab Title</label>
                            <input 
                                type="text" required
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                            </div>
                            <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Slug</label>
                            <input 
                                type="text" required
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 font-mono text-sm text-slate-800 dark:text-white"
                                value={formData.slug}
                                onChange={e => setFormData({...formData, slug: e.target.value})}
                            />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Difficulty</label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                                value={formData.difficulty}
                                onChange={e => setFormData({...formData, difficulty: e.target.value as LabDifficulty})}
                            >
                                {Object.values(LabDifficulty).map(d => (
                                <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            </div>
                            <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            />
                            </div>
                            <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Est. Minutes</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                                value={formData.estimated_time_minutes}
                                onChange={e => setFormData({...formData, estimated_time_minutes: parseInt(e.target.value)})}
                            />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Short Description</label>
                            <textarea 
                            rows={2}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                            value={formData.short_description}
                            onChange={e => setFormData({...formData, short_description: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Guide (Markdown)</label>
                            <textarea 
                            rows={8}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 font-mono text-sm text-slate-800 dark:text-white"
                            value={formData.long_description}
                            onChange={e => setFormData({...formData, long_description: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tags (comma separated)</label>
                            <input 
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                            value={formData.tags?.join(', ')}
                            onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})}
                            />
                        </div>
                   </div>
               )}

               {/* CONFIG TAB */}
               {activeTab === 'config' && (
                   <div className="p-6 space-y-5 h-full flex flex-col">
                       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex gap-3">
                            <Code className="text-blue-500 shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400">Orchestration Logic</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    The system will dynamically replace <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-bold">{PORT_PLACEHOLDER}</code> with an available port on the host server during runtime. 
                                    Do not hardcode host ports (e.g. 80:80) to avoid conflicts.
                                </p>
                            </div>
                       </div>

                       <div className="flex-1 flex flex-col">
                           <div className="flex justify-between items-center mb-1">
                               <label className="block text-xs font-bold uppercase text-slate-500">Docker Compose (YAML)</label>
                               <span className="text-xs text-slate-400">Supports Docker Compose v3</span>
                           </div>
                           <textarea 
                             className="w-full flex-1 bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-lg outline-none border border-slate-700 focus:border-idn-500 resize-none leading-relaxed"
                             spellCheck={false}
                             value={configData.content}
                             onChange={e => setConfigData({...configData, content: e.target.value})}
                           />
                       </div>

                       <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Internal Container Port</label>
                           <input 
                             type="number"
                             className="w-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-idn-500 text-slate-800 dark:text-white"
                             value={configData.base_port}
                             onChange={e => setConfigData({...configData, base_port: parseInt(e.target.value)})}
                           />
                           <p className="text-xs text-slate-400 mt-1">The port exposed by the container (e.g., 80 for Nginx, 3000 for Node).</p>
                       </div>
                   </div>
               )}

               <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3 mt-auto">
                   <button 
                      type="button"
                      onClick={() => setEditorOpen(false)}
                      className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-idn-500/20"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Draft'}
                    </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
               <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Upload className="text-idn-500" /> Publish Version
               </h3>
               <p className="text-sm text-slate-500 mt-1">
                 This will update the live template. Users with older versions pinned will see an upgrade option.
               </p>
            </div>
            
            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semantic Version</label>
                 <input 
                   type="text" required placeholder="e.g. 1.0.1"
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-800 dark:text-white outline-none focus:border-idn-500"
                   value={publishData.version}
                   onChange={e => setPublishData({...publishData, version: e.target.value})}
                 />
               </div>
               
               <div>
                 <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Changelog Notes</label>
                 <textarea 
                   required placeholder="What changed in this version?"
                   rows={3}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-idn-500"
                   value={publishData.notes}
                   onChange={e => setPublishData({...publishData, notes: e.target.value})}
                 />
               </div>

               <div className="pt-2 flex justify-end gap-3">
                 <button 
                    type="button"
                    onClick={() => setPublishOpen(false)}
                    className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg shadow-green-600/20"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Live'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabManager;
