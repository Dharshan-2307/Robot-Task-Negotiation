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
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Alerts & Warnings
          </h3>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400 mr-1" />
          {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                filterSeverity === sev
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          <div className="h-40 flex flex-col items-center justify-center text-slate-500">
            <CheckCircle className="w-8 h-8 opacity-40 text-emerald-600 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No active alerts</p>
            <p className="text-[10px] text-slate-500 mt-1">All subsystems operating within nominal thresholds</p>
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
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {alert.severity === 'critical' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-600">
                      [{alert.category}]
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                </div>

                <p className="text-xs font-medium mb-1.5">{alert.message}</p>

                {alert.robotId && (
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500 font-medium">Source:</span>
                    <button
                      onClick={() => selectRobot(alert.robotId!)}
                      className="px-1.5 py-0.5 rounded font-mono font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs"
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
