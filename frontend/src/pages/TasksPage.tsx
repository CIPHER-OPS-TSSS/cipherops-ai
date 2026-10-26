import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Clock, User, ArrowRight, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Task } from '../types';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cases, setCases] = useState<any[]>([]);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [caseId, setCaseId] = useState('');
  const [dueDate, setDueDate] = useState('2026-07-20');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    api.getCases().then(res => setCases(res.cases || []));
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
      alert(`Error updating task: ${err.message}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask({
        title,
        description,
        priority,
        caseId: caseId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  const columns = [
    { key: 'TODO', label: 'To Do', border: 'border-slate-700' },
    { key: 'IN_PROGRESS', label: 'In Progress', border: 'border-cyan-500/40' },
    { key: 'UNDER_REVIEW', label: 'Under Review', border: 'border-amber-500/40' },
    { key: 'DONE', label: 'Completed', border: 'border-emerald-500/40' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-cyan-400" />
            <span>INVESTIGATION TASK MANAGEMENT</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational action items, forensic request tracking, and supervisory workflow coordination.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Plus className="h-4 w-4" />
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-xl border ${col.border} bg-graphite-900/80 p-4 flex flex-col min-h-[480px] shadow-xl`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-graphite-800 mb-3">
                <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-graphite-800 bg-graphite-950 p-3.5 space-y-2 hover:border-cyan-500/40 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        task.priority === 'URGENT' ? 'bg-red-950 text-red-300 border border-red-800' :
                        task.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-100">{task.title}</h4>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">{task.description}</p>
                    )}

                    {task.case && (
                      <p className="font-mono text-[10px] text-cyan-400 truncate">
                        Docket: {task.case.caseNumber}
                      </p>
                    )}

                    <div className="pt-2 border-t border-graphite-850 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Assigned to: {task.assignedTo?.fullName || 'Investigator'}</span>
                    </div>

                    {/* Quick Move Buttons */}
                    <div className="pt-1 flex space-x-1">
                      {col.key !== 'TODO' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'TODO')}
                          className="text-[9px] rounded bg-graphite-850 hover:bg-graphite-800 px-1.5 py-0.5 text-slate-400"
                        >
                          ← Todo
                        </button>
                      )}
                      {col.key !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                          className="text-[9px] rounded bg-cyan-950 hover:bg-cyan-900 px-1.5 py-0.5 text-cyan-300"
                        >
                          Progress
                        </button>
                      )}
                      {col.key !== 'DONE' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'DONE')}
                          className="text-[9px] rounded bg-emerald-950 hover:bg-emerald-900 px-1.5 py-0.5 text-emerald-300"
                        >
                          Done ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono flex items-center space-x-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                <span>CREATE INVESTIGATION TASK</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Serve Section 91 CrPC notice to bank"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Case Docket</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">General Administrative Task</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} — {c.title.slice(0, 28)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Instructions</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Specific procedural requirements, documents to secure, or instructions."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
