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
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'conflicts'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-black'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Collisions ({conflicts.length})
            {activeConflicts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('deadlocks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'deadlocks'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-black'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Deadlocks ({deadlocks.length})
            {activeDeadlocks.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('failures')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'failures'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-black'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Faults ({failedRobots.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* --- Conflicts Tab --- */}
        {activeTab === 'conflicts' && (
          conflicts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck className="w-8 h-8 opacity-40 text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Zero collision warnings detected</p>
              <p className="text-[10px] text-slate-500 mt-1">Autonomous collision avoidance active</p>
            </div>
          ) : (
            conflicts.slice(-30).reverse().map(conf => {
              const isResolved = conf.status === 'resolved';
              return (
                <div
                  key={conf.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isResolved
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-rose-50 border-rose-200 text-rose-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertOctagon className={`w-3.5 h-3.5 ${isResolved ? 'text-slate-400' : 'text-rose-600'}`} />
                      <span className="font-mono text-xs font-bold text-slate-900">{conf.id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({Math.round(conf.position.x)}, {Math.round(conf.position.y)})
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                      isResolved
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : conf.status === 'rerouting'
                        ? 'bg-black text-white'
                        : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                    }`}>
                      {conf.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium mb-2">{conf.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Affected:</span>
                      {conf.robotIds.map(rid => (
                        <button
                          key={rid}
                          onClick={() => selectRobot(rid)}
                          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white hover:bg-slate-100 text-black border border-slate-300 shadow-2xs"
                        >
                          {rid}
                        </button>
                      ))}
                    </div>
                    {conf.rerouteTriggered && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-800 font-mono font-bold">
                        <Navigation className="w-2.5 h-2.5 text-black" /> Dynamic Reroute Applied
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
            <div className="h-40 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck className="w-8 h-8 opacity-40 text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No deadlocks detected</p>
              <p className="text-[10px] text-slate-500 mt-1">Right-of-way resolution algorithms operating normally</p>
            </div>
          ) : (
            deadlocks.slice(-30).reverse().map(dl => {
              const isResolved = dl.status === 'resolved';
              return (
                <div
                  key={dl.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isResolved
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-amber-50 border-amber-200 text-amber-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${isResolved ? 'text-slate-400' : 'text-amber-600'}`} />
                      <span className="font-mono text-xs font-bold text-slate-900">{dl.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                      isResolved
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    }`}>
                      {dl.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium mb-2">{dl.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Cluster:</span>
                      {dl.robotIds.map(rid => (
                        <button
                          key={rid}
                          onClick={() => selectRobot(rid)}
                          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white hover:bg-slate-100 text-black border border-slate-300 shadow-2xs"
                        >
                          {rid}
                        </button>
                      ))}
                    </div>
                    {dl.recoveryAction && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold">
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
            <div className="h-40 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck className="w-8 h-8 opacity-40 text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700">100% Fleet Operational</p>
              <p className="text-[10px] text-slate-500 mt-1">Zero robot hardware or motor faults</p>
            </div>
          ) : (
            failedRobots.map(r => (
              <div
                key={r.id}
                className="p-3 rounded-lg border bg-rose-50 border-rose-200 hover:border-rose-300 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <button
                      onClick={() => selectRobot(r.id)}
                      className="font-mono text-xs font-bold text-rose-800 hover:underline"
                    >
                      {r.id}
                    </button>
                    <span className="text-[10px] text-slate-600 uppercase font-semibold">({r.capability})</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    Health: {Math.round(r.health)}%
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
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
