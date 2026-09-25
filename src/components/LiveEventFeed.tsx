// ============================================================================
// LIVE EVENT FEED — Real-time Activity Stream with Severity & Category Filtering
// ============================================================================

'use client';

import React, { useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Activity, AlertCircle, AlertTriangle, Info,
  CheckCircle2, Filter, Zap, ArrowRightLeft, Lock, Battery
} from 'lucide-react';
import { AlertSeverity } from '@/types';

function getEventIcon(type: string, severity: AlertSeverity) {
  if (type.includes('collision')) return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
  if (type.includes('deadlock')) return <Lock className="w-3.5 h-3.5 text-amber-400" />;
  if (type.includes('negotiation')) return <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />;
  if (type.includes('battery')) return <Battery className="w-3.5 h-3.5 text-orange-400" />;
  if (type.includes('failure')) return <Zap className="w-3.5 h-3.5 text-red-400" />;
  if (type.includes('completed')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (severity === 'critical') return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  if (severity === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  return <Info className="w-3.5 h-3.5 text-cyan-400" />;
}

export default function LiveEventFeed() {
  const events = useFleetStore(s => s.events);
  const selectRobot = useFleetStore(s => s.selectRobot);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredEvents = events
    .filter(e => severityFilter === 'all' ? true : e.severity === severityFilter)
    .slice(-60)
    .reverse();

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Fleet Event Stream
          </h3>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
        {filteredEvents.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600">
            <Activity className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs">Awaiting live telemetry events...</p>
          </div>
        ) : (
          filteredEvents.map(evt => {
            const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={evt.id}
                className={`p-2 rounded-lg text-xs flex items-start gap-2 border transition-all ${
                  evt.severity === 'critical'
                    ? 'bg-red-950/20 border-red-800/30 text-red-200'
                    : evt.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-800/30 text-amber-200'
                    : 'bg-slate-800/30 border-slate-700/30 text-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getEventIcon(evt.type, evt.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {evt.type}
                    </span>
                  </div>
                  <p className="text-xs leading-snug break-words">{evt.message}</p>

                  {/* Robot Tag shortcuts */}
                  {evt.robotIds && evt.robotIds.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {evt.robotIds.map(rid => (
                        <button
                          key={rid}
                          onClick={() => selectRobot(rid)}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800/80 hover:bg-cyan-900/50 text-cyan-400 border border-slate-700 hover:border-cyan-600 transition-colors"
                        >
                          {rid}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
