// ============================================================================
// CONFLICT & DEADLOCK MONITOR — Collision warnings, deadlocks, failure recovery
// ============================================================================

'use client';

import React, { useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  AlertTriangle, Lock, ShieldCheck, RefreshCw, XCircle,
  AlertOctagon, CheckCircle2, Navigation, Zap
} from 'lucide-react';

export default function ConflictDeadlockMonitor() {
  const conflicts = useFleetStore(s => s.conflicts);
  const deadlocks = useFleetStore(s => s.deadlocks);
  const robots = useFleetStore(s => s.robots);
  const selectRobot = useFleetStore(s => s.selectRobot);

  const [activeTab, setActiveTab] = useState<'conflicts' | 'deadlocks' | 'failures'>('conflicts');

  const failedRobots = robots.filter(r => r.state === 'failed');
  const activeConflicts = conflicts.filter(c => c.status !== 'resolved');
  const activeDeadlocks = deadlocks.filter(d => d.status !== 'resolved');

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'conflicts'
                ? 'bg-rose-900/40 text-rose-300 border border-rose-700/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Collisions ({conflicts.length})
            {activeConflicts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('deadlocks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'deadlocks'
                ? 'bg-amber-900/40 text-amber-300 border border-amber-700/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Deadlocks ({deadlocks.length})
            {activeDeadlocks.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('failures')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'failures'
                ? 'bg-red-900/40 text-red-300 border border-red-700/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            Faults ({failedRobots.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* --- Conflicts Tab --- */}
        {activeTab === 'conflicts' && (
          conflicts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-600">
              <ShieldCheck className="w-8 h-8 opacity-30 text-emerald-500 mb-2" />
              <p className="text-xs">Zero collision warnings detected</p>
              <p className="text-[10px] text-slate-700 mt-1">Autonomous collision avoidance active</p>
            </div>
          ) : (
            conflicts.slice(-30).reverse().map(conf => {
              const isResolved = conf.status === 'resolved';
              return (
                <div
                  key={conf.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isResolved
                      ? 'bg-slate-800/40 border-slate-700/40'
                      : 'bg-rose-950/20 border-rose-800/40 hover:border-rose-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertOctagon className={`w-3.5 h-3.5 ${isResolved ? 'text-slate-500' : 'text-rose-400'}`} />
                      <span className="font-mono text-xs font-bold text-slate-300">{conf.id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({Math.round(conf.position.x)}, {Math.round(conf.position.y)})
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                      isResolved
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/30'
                        : conf.status === 'rerouting'
                        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/30'
                        : 'bg-rose-900/40 text-rose-400 border border-rose-700/40 animate-pulse'
                    }`}>
                      {conf.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2">{conf.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Affected:</span>
                      {conf.robotIds.map(rid => (
                        <button
                          key={rid}
                          onClick={() => selectRobot(rid)}
                          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 border border-slate-700 hover:border-cyan-700"
                        >
                          {rid}
                        </button>
                      ))}
                    </div>
                    {conf.rerouteTriggered && (
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                        <Navigation className="w-2.5 h-2.5" /> Dynamic Reroute Applied
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}

        {/* --- Deadlocks Tab --- */}
        {activeTab === 'deadlocks' && (
          deadlocks.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-600">
              <ShieldCheck className="w-8 h-8 opacity-30 text-emerald-500 mb-2" />
              <p className="text-xs">No deadlocks detected</p>
              <p className="text-[10px] text-slate-700 mt-1">Right-of-way resolution algorithms operating normally</p>
            </div>
          ) : (
            deadlocks.slice(-30).reverse().map(dl => {
              const isResolved = dl.status === 'resolved';
              return (
                <div
                  key={dl.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isResolved
                      ? 'bg-slate-800/40 border-slate-700/40'
                      : 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${isResolved ? 'text-slate-500' : 'text-amber-400'}`} />
                      <span className="font-mono text-xs font-bold text-slate-300">{dl.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                      isResolved
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/30'
                        : 'bg-amber-900/40 text-amber-400 border border-amber-700/40 animate-pulse'
                    }`}>
                      {dl.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2">{dl.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Cluster:</span>
                      {dl.robotIds.map(rid => (
                        <button
                          key={rid}
                          onClick={() => selectRobot(rid)}
                          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 border border-slate-700 hover:border-cyan-700"
                        >
                          {rid}
                        </button>
                      ))}
                    </div>
                    {dl.recoveryAction && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {dl.recoveryAction}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}

        {/* --- Failures Tab --- */}
        {activeTab === 'failures' && (
          failedRobots.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-600">
              <ShieldCheck className="w-8 h-8 opacity-30 text-emerald-500 mb-2" />
              <p className="text-xs">100% Fleet Operational</p>
              <p className="text-[10px] text-slate-700 mt-1">Zero robot hardware or motor faults</p>
            </div>
          ) : (
            failedRobots.map(r => (
              <div
                key={r.id}
                className="p-3 rounded-lg border bg-red-950/20 border-red-800/40 hover:border-red-600/50 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <button
                      onClick={() => selectRobot(r.id)}
                      className="font-mono text-xs font-bold text-red-300 hover:underline"
                    >
                      {r.id}
                    </button>
                    <span className="text-[10px] text-slate-400 uppercase">({r.capability})</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-red-900/40 text-red-400 border border-red-700/40">
                    Health: {Math.round(r.health)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Unit immobilized. Active tasks auto-reassigned via Contract-Net protocol.
                </p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
