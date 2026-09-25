'use client';

import React, { useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Filter,
  Package,
  Wrench,
  Shield,
  Zap
} from 'lucide-react';
import { CommunityIssue, IssueCategory } from '@/types/community';

export const CommunityTaskTable: React.FC = () => {
  const { issues, resolveIssue, robots } = useCommunityStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.status === filter;
  });

  const getCategoryIcon = (cat: IssueCategory) => {
    switch (cat) {
      case 'package_delivery':
        return <Package className="w-3.5 h-3.5 text-black" />;
      case 'water_pipe_leak':
        return <Wrench className="w-3.5 h-3.5 text-black" />;
      case 'smart_bin_overflow':
        return <Clock className="w-3.5 h-3.5 text-black" />;
      case 'ev_charger_fault':
        return <Zap className="w-3.5 h-3.5 text-black" />;
      case 'fire_lane_blocked':
        return <Shield className="w-3.5 h-3.5 text-black" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-black" />;
    }
  };

  return (
    <div className="bg-white border-2 border-black p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black mb-3">
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wider">
            Resident Service Requests & Facility Tickets
          </h3>
          <p className="text-xs text-neutral-600">
            Real-time decentralized dispatch across residential towers & utility infrastructure
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center border border-black bg-neutral-100 p-0.5">
          {(['all', 'pending', 'in_progress', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-xs font-bold capitalize transition-colors ${
                filter === tab ? 'bg-black text-white' : 'text-neutral-700 hover:text-black'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 text-neutral-700 border-b border-black uppercase text-[10px] font-bold sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3">Ticket ID</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Location</th>
              <th className="py-2 px-3">Severity</th>
              <th className="py-2 px-3">Assigned Bot</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-neutral-400 font-medium">
                  No tickets found matching this filter.
                </td>
              </tr>
            ) : (
              filteredIssues.map(issue => {
                const assignedRobot = robots.find(r => r.id === issue.assignedRobotId);

                return (
                  <tr key={issue.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-black">
                      {issue.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                        {getCategoryIcon(issue.category)}
                        <span className="capitalize">{issue.category.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700 font-medium">
                      {issue.locationName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        issue.severity === 'critical'
                          ? 'bg-neutral-900 text-white border-black'
                          : issue.severity === 'high'
                          ? 'bg-neutral-200 text-black border-neutral-400'
                          : 'bg-white text-neutral-600 border-neutral-300'
                      }`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-black">
                      {assignedRobot ? (
                        <span className="bg-neutral-100 px-1.5 py-0.5 border border-neutral-300 rounded">
                          {assignedRobot.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">P2P Searching...</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        issue.status === 'resolved'
                          ? 'text-neutral-500'
                          : issue.status === 'in_progress'
                          ? 'text-black font-bold'
                          : 'text-neutral-600'
                      }`}>
                        {issue.status === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {issue.status === 'in_progress' && <Clock className="w-3.5 h-3.5" />}
                        <span className="capitalize">{issue.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {issue.status !== 'resolved' ? (
                        <button
                          onClick={() => resolveIssue(issue.id)}
                          className="px-2 py-1 text-[11px] font-bold border border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Complete</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
