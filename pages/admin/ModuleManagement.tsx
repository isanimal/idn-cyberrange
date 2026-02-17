import React, { useState } from 'react';
import Card from '../../components/UI/Card';
import { MODULES, MOCK_LESSONS } from '../../constants';
import { Module, Lesson } from '../../types';
import { Edit2, Trash2, Plus, Lock, Unlock, Search, Save, X, BookOpen, FileText, ChevronRight, Clock } from 'lucide-react';

const ModuleManagement: React.FC = () => {
  // --- MODULE STATE ---
  const [modules, setModules] = useState<Module[]>(MODULES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // --- LESSON STATE ---
  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState<Partial<Lesson>>({
    title: '',
    contentMd: '',
    estimatedTime: ''
  });

  // --- MODULE HANDLERS ---

  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    slug: '',
    description: '',
    level: 'Basic',
    order: 0,
    tags: []
  });

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData(module);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingModule(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      level: 'Basic',
      order: modules.length + 1,
      isLocked: true,
      tags: [],
      progress: 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      setModules(prev => prev.filter(m => m.id !== id));
      // Also cleanup lessons
      setLessons(prev => prev.filter(l => l.moduleId !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingModule) {
      // Update existing
      setModules(prev => prev.map(m => m.id === editingModule.id ? { ...m, ...formData } as Module : m));
    } else {
      // Create new
      const newModule = {
        ...formData,
        id: `m${Date.now()}`, // Simple ID generation
        progress: 0
      } as Module;
      setModules(prev => [...prev, newModule]);
    }
    
    setIsModalOpen(false);
  };

  const toggleLock = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, isLocked: !m.isLocked } : m));
  };

  // --- LESSON HANDLERS ---

  const handleManageContent = (module: Module) => {
    setSelectedModuleForLessons(module);
    setIsLessonModalOpen(true);
    // Reset lesson form
    setEditingLesson(null);
    setLessonFormData({ title: '', contentMd: '', estimatedTime: '' });
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForLessons) return;

    if (editingLesson) {
      // Update Existing Lesson
      setLessons(prev => prev.map(l => l.id === editingLesson.id ? { ...l, ...lessonFormData } as Lesson : l));
    } else {
      // Create New Lesson
      const newLesson: Lesson = {
        id: `ls${Date.now()}`,
        moduleId: selectedModuleForLessons.id,
        title: lessonFormData.title || 'Untitled Lesson',
        contentMd: lessonFormData.contentMd || '',
        estimatedTime: lessonFormData.estimatedTime || '10 min'
      };
      setLessons(prev => [...prev, newLesson]);
    }
    // Reset form after save
    setEditingLesson(null);
    setLessonFormData({ title: '', contentMd: '', estimatedTime: '' });
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      contentMd: lesson.contentMd,
      estimatedTime: lesson.estimatedTime
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    if(window.confirm('Delete this lesson?')) {
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      if (editingLesson?.id === lessonId) {
        setEditingLesson(null);
        setLessonFormData({ title: '', contentMd: '', estimatedTime: '' });
      }
    }
  };

  // --- FILTERING ---

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentModuleLessons = selectedModuleForLessons 
    ? lessons.filter(l => l.moduleId === selectedModuleForLessons.id)
    : [];

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

      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
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

        {/* Table */}
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
              {filteredModules.map((module) => (
                <tr key={module.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-500">#{module.order}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">{module.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{module.description}</div>
                  </td>
                  <td className="px-6 py-4">
                     <button 
                       onClick={() => handleManageContent(module)}
                       className="flex items-center gap-2 text-xs font-bold text-idn-600 dark:text-idn-400 hover:underline"
                     >
                       <BookOpen size={14} /> 
                       {lessons.filter(l => l.moduleId === module.id).length} Lessons
                     </button>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                      module.level === 'Basic' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      module.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {module.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleLock(module.id)}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors ${
                        module.isLocked 
                          ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400' 
                          : 'border-green-200 bg-green-50 text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400'
                      }`}
                    >
                      {module.isLocked ? <><Lock size={12} /> Locked</> : <><Unlock size={12} /> Active</>}
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
                        onClick={() => handleDelete(module.id)}
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

      {/* MODULE Edit/Create Modal */}
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
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Slug (URL Friendly)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none font-mono text-sm"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
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
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Difficulty Level</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.level}
                    onChange={e => setFormData({...formData, level: e.target.value as any})}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Sort Order</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.order}
                    onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                  />
                </div>
                 <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Tags (Comma Sep)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                    value={formData.tags?.join(', ')}
                    onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})}
                  />
                </div>
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
                  onClick={handleSave}
                  className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-idn-500/20"
                >
                  <Save size={18} /> Save Module
                </button>
            </div>
          </div>
        </div>
      )}

      {/* LESSON CONTENT MANAGER MODAL */}
      {isLessonModalOpen && selectedModuleForLessons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-5xl shadow-2xl flex flex-col h-[85vh]">
              {/* Header */}
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

              {/* Body: Split View */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left: List of Lessons */}
                <div className="w-1/3 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                     <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">Lessons</h4>
                     <button 
                       onClick={() => {
                         setEditingLesson(null);
                         setLessonFormData({ title: '', contentMd: '', estimatedTime: '' });
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
                        currentModuleLessons.map(lesson => (
                          <div 
                            key={lesson.id}
                            onClick={() => handleEditLesson(lesson)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              editingLesson?.id === lesson.id 
                                ? 'bg-white dark:bg-slate-800 border-idn-500 shadow-md' 
                                : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                             <div className="flex justify-between items-start">
                               <h5 className="font-bold text-sm text-slate-800 dark:text-white">{lesson.title}</h5>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                                 className="text-slate-400 hover:text-red-500 p-1"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                             <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                               <Clock size={10} /> {lesson.estimatedTime}
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                {/* Right: Editor Form */}
                <div className="w-2/3 flex flex-col bg-white dark:bg-slate-800">
                   <div className="p-6 flex-1 overflow-y-auto">
                     <h4 className="font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">
                       {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                     </h4>
                     <form id="lessonForm" onSubmit={handleSaveLesson} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                             <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Lesson Title</label>
                             <input 
                               type="text" required
                               className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                               value={lessonFormData.title}
                               onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})}
                             />
                          </div>
                          <div>
                             <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Est. Time</label>
                             <input 
                               type="text" placeholder="e.g. 15 min" required
                               className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                               value={lessonFormData.estimatedTime}
                               onChange={e => setLessonFormData({...lessonFormData, estimatedTime: e.target.value})}
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
                             value={lessonFormData.contentMd}
                             onChange={e => setLessonFormData({...lessonFormData, contentMd: e.target.value})}
                           />
                        </div>
                     </form>
                   </div>
                   
                   <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                      <button 
                        onClick={() => setIsLessonModalOpen(false)}
                        className="px-4 py-2 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                      >
                        Close
                      </button>
                      <button 
                        type="submit"
                        form="lessonForm"
                        className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <Save size={18} /> {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                      </button>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ModuleManagement;