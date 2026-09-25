// ============================================================================
// NEGOTIATION MONITOR — Robot-to-Robot Negotiation Events & Resolution
// ============================================================================

'use client';

import React, { useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Handshake, CheckCircle2, Clock, AlertTriangle,
  ArrowRightLeft, ShieldAlert, Cpu, Sparkles
} from 'lucide-react';

const REASON_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'right-of-way': { label: 'Right of Way', icon: <ArrowRightLeft className="w-3.5 h-3.5" />, color: 'text-slate-900 bg-slate-100 border-slate-300' },
  'task-conflict': { label: 'Task Conflict', icon: <Cpu className="w-3.5 h-3.5" />, color: 'text-amber-800 bg-amber-50 border-amber-300' },
  'resource-conflict': { label: 'Resource Conflict', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'text-indigo-800 bg-indigo-50 border-indigo-300' },
  'priority-override': { label: 'Priority Override', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-rose-800 bg-rose-50 border-rose-300' },
  'charging-station': { label: 'Charging Pad', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
};

export default function NegotiationMonitor() {
  const negotiations = useFleetStore(s => s.negotiations);
  const selectRobot = useFleetStore(s => s.selectRobot);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'resolved'>('all');

  const filtered = negotiations
    .filter(n => filter === 'all' ? true : n.status === filter)
    .slice(-50)
    .reverse();

  const activeCount = negotiations.filter(n => n.status === 'in-progress').length;
  const resolvedCount = negotiations.filter(n => n.status === 'resolved').length;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Handshake className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Robot-to-Robot Negotiations
          </h3>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300">
            {activeCount} Active
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              filter === 'all' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({negotiations.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              filter === 'in-progress' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              filter === 'resolved' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500">
            <Handshake className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No negotiation events recorded yet</p>
            <p className="text-[10px] text-slate-500 mt-1">Autonomous agents negotiate right-of-way in real time</p>
          </div>
        ) : (
          filtered.map(neg => {
            const reasonConfig = REASON_LABELS[neg.reason] || {
              label: neg.reason,
              icon: <Handshake className="w-3.5 h-3.5" />,
              color: 'text-slate-800 bg-slate-100 border-slate-300',
            };
            const isPending = neg.status === 'in-progress';

            return (
              <div
                key={neg.id}
                className={`p-3 rounded-lg border transition-all ${
                  isPending
                    ? 'bg-slate-50 border-slate-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${reasonConfig.color}`}>
                      {reasonConfig.icon}
                      {reasonConfig.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{neg.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full flex items-center gap-1 ${
                    isPending
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {isPending ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                    {neg.status}
                  </span>
                </div>

                {/* Agents Involved */}
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Peers:</span>
                  {neg.robotIds.map((rid, idx) => (
                    <React.Fragment key={rid}>
                      <button
                        onClick={() => selectRobot(rid)}
                        className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-white hover:bg-slate-100 text-black border border-slate-300 shadow-2xs transition-colors"
                      >
                        {rid}
                      </button>
                      {idx < neg.robotIds.length - 1 && (
                        <span className="text-slate-400 text-xs font-bold">↔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Description & Outcome */}
                <p className="text-xs text-slate-800 font-medium mb-1">{neg.description}</p>

                {neg.result && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Protocol Decision:</span>
                    <span className="font-bold text-black font-mono">{neg.result}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
