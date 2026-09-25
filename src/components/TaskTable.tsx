// ============================================================================
// TASK MANAGEMENT TABLE — Filterable, Searchable Task List
// ============================================================================

'use client';

import React, { useState, useMemo } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'pending': 'bg-slate-100 text-slate-700 border border-slate-300',
  'assigned': 'bg-blue-50 text-blue-800 border border-blue-200',
  'in-progress': 'bg-black text-white',
  'completed': 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  'failed': 'bg-rose-50 text-rose-800 border border-rose-200',
  'reassigned': 'bg-amber-50 text-amber-800 border border-amber-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  'critical': 'bg-rose-100 text-rose-800 border-rose-300',
  'high': 'bg-amber-100 text-amber-800 border-amber-300',
  'medium': 'bg-blue-100 text-blue-800 border-blue-300',
  'low': 'bg-slate-100 text-slate-700 border-slate-300',
};

export default function TaskTable() {
  const tasks = useFleetStore(s => s.tasks);
  const selectTask = useFleetStore(s => s.selectTask);
  const selectedTaskId = useFleetStore(s => s.selectedTaskId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'priority' | 'status' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.assignedRobotId?.toLowerCase().includes(q) ||
        t.requiredCapability.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'priority') {
        cmp = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else {
        cmp = a.createdAt - b.createdAt;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered.slice(0, 100); // Limit for perf
  }, [tasks, search, statusFilter, priorityFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200 bg-slate-50">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black font-medium"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg text-[10px] text-slate-700 font-bold px-2 py-1.5 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="reassigned">Reassigned</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg text-[10px] text-slate-700 font-bold px-2 py-1.5 focus:outline-none"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <span className="text-[10px] text-slate-500 font-mono font-bold ml-auto">{filteredTasks.length}/{tasks.length} tasks</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold">ID</th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Task</th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold cursor-pointer" onClick={() => toggleSort('priority')}>
                <span className="flex items-center gap-1">Priority <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Capability</th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Robot</th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold cursor-pointer" onClick={() => toggleSort('status')}>
                <span className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold">ETA</th>
              <th className="text-left p-2.5 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map(task => (
              <tr
                key={task.id}
                onClick={() => selectTask(task.id === selectedTaskId ? null : task.id)}
                className={`cursor-pointer transition-colors ${
                  task.id === selectedTaskId
                    ? 'bg-slate-100 font-semibold'
                    : 'hover:bg-slate-50'
                }`}
              >
                <td className="p-2.5 font-mono text-slate-600 font-bold">{task.id}</td>
                <td className="p-2.5 text-slate-900 font-medium max-w-[150px] truncate">{task.name}</td>
                <td className="p-2.5">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${PRIORITY_COLORS[task.priority] || ''}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-2.5 text-slate-600 capitalize">{task.requiredCapability}</td>
                <td className="p-2.5 font-mono font-bold text-black">{task.assignedRobotId || '—'}</td>
                <td className="p-2.5">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${STATUS_COLORS[task.status] || ''}`}>
                    {task.status}
                  </span>
                </td>
                <td className="p-2.5 font-mono text-slate-700">{task.eta ? `${task.eta}s` : '—'}</td>
                <td className="p-2.5 font-mono text-slate-500 text-[10px]">
                  ({Math.round(task.location.x)},{Math.round(task.location.y)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-500 text-xs">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}
