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
  'right-of-way': { label: 'Right of Way', icon: <ArrowRightLeft className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-900/30 border-cyan-800/40' },
  'task-conflict': { label: 'Task Conflict', icon: <Cpu className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-900/30 border-amber-800/40' },
  'resource-conflict': { label: 'Resource Conflict', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'text-purple-400 bg-purple-900/30 border-purple-800/40' },
  'priority-override': { label: 'Priority Override', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-rose-400 bg-rose-900/30 border-rose-800/40' },
  'charging-station': { label: 'Charging Pad', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-lime-400 bg-lime-900/30 border-lime-800/40' },
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
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Handshake className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Robot-to-Robot Negotiations
          </h3>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-900/40 text-purple-300 border border-purple-700/40">
            {activeCount} Active
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All ({negotiations.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'in-progress' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'resolved' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600">
            <Handshake className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs">No negotiation events recorded yet</p>
            <p className="text-[10px] text-slate-700 mt-1">Autonomous agents negotiate right-of-way in real time</p>
          </div>
        ) : (
          filtered.map(neg => {
            const reasonConfig = REASON_LABELS[neg.reason] || {
              label: neg.reason,
              icon: <Handshake className="w-3.5 h-3.5" />,
              color: 'text-slate-400 bg-slate-800 border-slate-700',
            };
            const isPending = neg.status === 'in-progress';

            return (
              <div
                key={neg.id}
                className={`p-3 rounded-lg border transition-all ${
                  isPending
                    ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-600/50'
                    : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${reasonConfig.color}`}>
                      {reasonConfig.icon}
                      {reasonConfig.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{neg.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full flex items-center gap-1 ${
                    isPending
                      ? 'bg-amber-900/30 text-amber-300 border border-amber-700/40 animate-pulse'
                      : 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40'
                  }`}>
                    {isPending ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                    {neg.status}
                  </span>
                </div>

                {/* Agents Involved */}
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold">Peers:</span>
                  {neg.robotIds.map((rid, idx) => (
                    <React.Fragment key={rid}>
                      <button
                        onClick={() => selectRobot(rid)}
                        className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition-colors"
                      >
                        {rid}
                      </button>
                      {idx < neg.robotIds.length - 1 && (
                        <span className="text-slate-600 text-xs">↔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Description & Outcome */}
                <p className="text-xs text-slate-300 mb-1">{neg.description}</p>

                {neg.result && (
                  <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Protocol Decision:</span>
                    <span className="font-semibold text-emerald-400 font-mono">{neg.result}</span>
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
