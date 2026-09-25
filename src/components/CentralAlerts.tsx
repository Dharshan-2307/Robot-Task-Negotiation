// ============================================================================
// CENTRAL ALERTS — Centralized Critical Warning and Notice Center
// ============================================================================

'use client';

import React, { useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle,
  Filter, ShieldAlert, X
} from 'lucide-react';
import { AlertSeverity } from '@/types';

export default function CentralAlerts() {
  const alerts = useFleetStore(s => s.alerts);
  const selectRobot = useFleetStore(s => s.selectRobot);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.resolved).length;

  const filtered = alerts
    .filter(a => filterSeverity === 'all' ? true : a.severity === filterSeverity)
    .slice(-40)
    .reverse();

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Alerts & Warnings
          </h3>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-900/60 text-rose-300 border border-rose-700/50 animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition-colors ${
                filterSeverity === sev
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600">
            <CheckCircle className="w-8 h-8 opacity-30 text-emerald-400 mb-2" />
            <p className="text-xs">No active alerts</p>
            <p className="text-[10px] text-slate-700 mt-1">All subsystems operating within nominal thresholds</p>
          </div>
        ) : (
          filtered.map(alert => {
            const timeStr = new Date(alert.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={alert.id}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {alert.severity === 'critical' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                      [{alert.category}]
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                </div>

                <p className="text-xs mb-1.5">{alert.message}</p>

                {alert.robotId && (
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                    <span className="text-slate-500">Source:</span>
                    <button
                      onClick={() => selectRobot(alert.robotId!)}
                      className="px-1.5 py-0.2 rounded font-mono font-bold text-cyan-400 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                    >
                      {alert.robotId}
                    </button>
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
