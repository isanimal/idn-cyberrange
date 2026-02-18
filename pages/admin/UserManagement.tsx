import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/UI/Card';
import { AdminAssignedModuleItem, AdminUserModuleOption, UserRole, UserStatus } from '../../types';
import { RotateCcw, Shield, User, UserPlus, UserX, X, Trash2, UserCheck, BookOpen, Search } from 'lucide-react';
import { adminUserModulesApi } from '../../services/adminUserModulesApi';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
}

const UserManagement: React.FC = () => {
  const {
    getAllUsers,
    fetchUsers,
    registerUser,
    suspendUser,
    unsuspendUser,
    resetUserAttempts,
    deleteUser,
    restoreUser,
    user: currentUser,
  } = useAuth();
  const users = getAllUsers();
  
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [assignedModules, setAssignedModules] = useState<AdminAssignedModuleItem[]>([]);
  const [availableModules, setAvailableModules] = useState<AdminUserModuleOption[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [moduleSearch, setModuleSearch] = useState('');

  const loadUsers = async (targetPage = page, withDeleted = includeDeleted) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await fetchUsers(targetPage, withDeleted);
      setMeta(result.meta);
      setPage(result.meta.current_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(page, includeDeleted);
  }, [includeDeleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await registerUser(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: UserRole.USER });
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async (id: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      await suspendUser(id);
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsuspend = async (id: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      await unsuspendUser(id);
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAttempts = async (id: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      await resetUserAttempts(id);
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset attempts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this user? This is a soft delete and can be restored.')) return;

    setError('');
    setIsSubmitting(true);
    try {
      await deleteUser(id);
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (id: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await restoreUser(id);
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = async (target: { id: string; name: string; email: string }) => {
    setError('');
    setIsSubmitting(true);
    setSelectedUser(target);
    setShowAssignModal(true);
    setSelectedModuleIds([]);
    setModuleSearch('');
    try {
      const data = await adminUserModulesApi.list(target.id);
      setAssignedModules(data.assigned);
      setAvailableModules(data.available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module assignments.');
      setShowAssignModal(false);
      setSelectedUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignModules = async () => {
    if (!selectedUser || selectedModuleIds.length === 0) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const data = await adminUserModulesApi.assign(selectedUser.id, selectedModuleIds);
      setAssignedModules(data.assigned);
      setAvailableModules(data.available);
      setSelectedModuleIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign modules.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignModule = async (moduleId: string) => {
    if (!selectedUser) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await adminUserModulesApi.unassign(selectedUser.id, moduleId);
      const data = await adminUserModulesApi.list(selectedUser.id);
      setAssignedModules(data.assigned);
      setAvailableModules(data.available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAvailableModules = availableModules.filter((module) => {
    const query = moduleSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return module.title.toLowerCase().includes(query) ||
      module.slug.toLowerCase().includes(query) ||
      (module.description ?? '').toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Create and manage platform access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeDeleted((prev) => !prev)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
              includeDeleted
                ? 'border-idn-500 text-idn-600 dark:text-idn-400'
                : 'border-slate-300 text-slate-600 dark:text-slate-300'
            }`}
          >
            {includeDeleted ? 'Hide Deleted' : 'Show Deleted'}
          </button>
          <button 
            onClick={() => setShowModal(true)}
            disabled={isSubmitting}
            className="bg-idn-500 hover:bg-idn-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <UserPlus size={18} /> Register New User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-sm text-slate-500">Loading users...</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      u.role === UserRole.ADMIN 
                        ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      u.status === UserStatus.ACTIVE
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                        : u.status === UserStatus.SUSPENDED
                          ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                          : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-white">{u.points}</span> PTS / {u.completedModules} Modules
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser?.id && (
                      <div className="flex justify-end items-center gap-1">
                        <button
                          onClick={() => void openAssignModal({ id: u.id, name: u.name, email: u.email })}
                          disabled={isSubmitting}
                          className="p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Assign Modules"
                        >
                          <BookOpen size={18} />
                        </button>
                        <button
                          onClick={() => void handleResetAttempts(u.id)}
                          disabled={isSubmitting}
                          className="p-2 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500 transition-colors"
                          title="Reset Attempts"
                        >
                          <RotateCcw size={18} />
                        </button>
                        {u.status === UserStatus.ACTIVE && (
                          <button
                            onClick={() => void handleSuspend(u.id)}
                            disabled={isSubmitting}
                            className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                            title="Suspend User"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                        {u.status === UserStatus.SUSPENDED && (
                          <button
                            onClick={() => void handleUnsuspend(u.id)}
                            disabled={isSubmitting}
                            className="p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-400 hover:text-green-500 transition-colors"
                            title="Unsuspend User"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        {u.status !== UserStatus.DELETED && (
                          <button
                            onClick={() => void handleRemove(u.id)}
                            disabled={isSubmitting}
                            className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove User"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        {u.status === UserStatus.DELETED && (
                          <button
                            onClick={() => void handleRestore(u.id)}
                            disabled={isSubmitting}
                            className="p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Restore User"
                          >
                            <RotateCcw size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <div className="text-xs text-slate-500">
              Page {meta.current_page} of {meta.last_page} ({meta.total} users)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadUsers(page - 1)}
                disabled={isSubmitting || isLoading || page <= 1}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 text-slate-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => void loadUsers(page + 1)}
                disabled={isSubmitting || isLoading || (meta.current_page >= meta.last_page)}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl transition-colors">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Assign Modules</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Assigned Modules</h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-72 overflow-auto">
                  {assignedModules.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No modules assigned.</div>
                  ) : (
                    assignedModules.map((assignment) => (
                      <div key={assignment.assignment_id} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white text-sm">{assignment.module.title}</div>
                          <div className="text-xs text-slate-500">{assignment.module.slug} • {assignment.status}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleUnassignModule(assignment.module_id)}
                          disabled={isSubmitting}
                          className="px-2 py-1 text-xs font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Unassign
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Available Modules</h4>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Search modules..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-idn-500"
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-72 overflow-auto">
                  {filteredAvailableModules.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No available modules.</div>
                  ) : (
                    filteredAvailableModules.map((module) => (
                      <label key={module.id} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedModuleIds.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModuleIds((prev) => [...prev, module.id]);
                              return;
                            }
                            setSelectedModuleIds((prev) => prev.filter((id) => id !== module.id));
                          }}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white text-sm">{module.title}</div>
                          <div className="text-xs text-slate-500">{module.slug}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleAssignModules()}
                  disabled={isSubmitting || selectedModuleIds.length === 0}
                  className="w-full bg-idn-500 text-white font-semibold py-2.5 rounded-lg hover:bg-idn-600 disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : `Assign Selected (${selectedModuleIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl transition-colors">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Register New User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Temporary Password</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-idn-500 outline-none font-mono"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: UserRole.USER})}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${
                      formData.role === UserRole.USER 
                      ? 'bg-idn-50 border-idn-500 text-idn-600 dark:bg-idn-900/30 dark:text-idn-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <User size={16} /> User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: UserRole.ADMIN})}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${
                      formData.role === UserRole.ADMIN 
                      ? 'bg-purple-50 border-purple-500 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <Shield size={16} /> Admin
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-idn-500 text-white font-bold py-3 rounded-lg hover:bg-idn-600 transition-colors shadow-lg shadow-idn-500/20">
                  {isSubmitting ? 'Processing...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
