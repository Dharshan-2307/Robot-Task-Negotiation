// ============================================================================
// ROBOT DETAILS PANEL — Telemetry, Battery, Route, Task, Alerts
// ============================================================================

'use client';

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  X, Battery, Heart, MapPin, Navigation, Clock, Cpu,
  AlertTriangle, Zap, Route
} from 'lucide-react';

function getBatteryColor(level: number): string {
  if (level > 60) return 'text-green-400';
  if (level > 30) return 'text-amber-400';
  return 'text-red-400';
}

function getStateColor(state: string): string {
  switch (state) {
    case 'active': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'idle': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'charging': return 'bg-lime-500/20 text-lime-400 border-lime-500/30';
    case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'negotiating': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'deadlocked': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    case 'rerouting': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export default function RobotDetailsPanel() {
  const selectedRobotId = useFleetStore(s => s.selectedRobotId);
  const robots = useFleetStore(s => s.robots);
  const tasks = useFleetStore(s => s.tasks);
  const selectRobot = useFleetStore(s => s.selectRobot);

  const robot = robots.find(r => r.id === selectedRobotId);

  if (!robot) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 bg-white">
        <MapPin className="w-10 h-10 mb-3 opacity-30 text-slate-400" />
        <p className="text-sm font-semibold text-slate-800">Select a robot on the map</p>
        <p className="text-xs text-slate-500 mt-1">Click any robot marker to view live telemetry</p>
      </div>
    );
  }

  const currentTask = robot.currentTaskId ? tasks.find(t => t.id === robot.currentTaskId) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            robot.state === 'active' ? 'bg-black' :
            robot.state === 'idle' ? 'bg-amber-500' :
            robot.state === 'charging' ? 'bg-emerald-500' :
            robot.state === 'failed' ? 'bg-rose-500 animate-pulse' :
            robot.state === 'negotiating' ? 'bg-indigo-600' :
            robot.state === 'deadlocked' ? 'bg-rose-600 animate-pulse' :
            'bg-slate-400'
          }`} />
          <h3 className="text-sm font-bold text-black font-mono">{robot.id}</h3>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${getStateColor(robot.state)}`}>
            {robot.state}
          </span>
        </div>
        <button onClick={() => selectRobot(null)} className="p-1 hover:bg-slate-200 rounded transition-colors">
          <X className="w-4 h-4 text-slate-500 hover:text-black" />
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {/* Position & Navigation */}
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Position & Navigation</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 font-medium">
                <MapPin className="w-3 h-3" /> Position
              </div>
              <p className="text-xs font-mono font-bold text-slate-900">
                ({Math.round(robot.position.x)}, {Math.round(robot.position.y)})
              </p>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 font-medium">
                <Navigation className="w-3 h-3" /> Speed
              </div>
              <p className="text-xs font-mono font-bold text-slate-900">{robot.speed.toFixed(1)} u/s</p>
            </div>
          </div>
          {robot.eta != null && (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 font-medium">
                <Clock className="w-3 h-3" /> ETA
              </div>
              <p className="text-xs font-mono font-bold text-slate-900">{robot.eta}s remaining</p>
            </div>
          )}
          {robot.route.length > 0 && (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 font-medium">
                <Route className="w-3 h-3" /> Route
              </div>
              <p className="text-xs font-mono font-bold text-slate-900">{robot.route.length} waypoints</p>
              <div className="mt-1 space-y-0.5">
                {robot.route.slice(0, 4).map((wp, i) => (
                  <p key={i} className="text-[10px] font-mono text-slate-600">
                    WP{i + 1}: ({Math.round(wp.x)}, {Math.round(wp.y)})
                  </p>
                ))}
                {robot.route.length > 4 && (
                  <p className="text-[10px] text-slate-500">...+{robot.route.length - 4} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Battery & Health */}
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Battery & Health</h4>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <Battery className="w-3 h-3" /> Battery
              </div>
              <span className={`text-xs font-bold font-mono ${getBatteryColor(robot.battery)}`}>
                {Math.round(robot.battery)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  robot.battery > 60 ? 'bg-emerald-600' : robot.battery > 30 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${robot.battery}%` }}
              />
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <Heart className="w-3 h-3" /> Health
              </div>
              <span className={`text-xs font-bold font-mono ${
                robot.health > 70 ? 'text-emerald-700' : robot.health > 40 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {Math.round(robot.health)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  robot.health > 70 ? 'bg-emerald-600' : robot.health > 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${robot.health}%` }}
              />
            </div>
          </div>
        </div>

        {/* Capability */}
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Capability</h4>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1 font-medium">
              <Cpu className="w-3 h-3" /> Type
            </div>
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase rounded">
              {robot.capability}
            </span>
          </div>
        </div>

        {/* Current Task */}
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Current Task</h4>
          {currentTask ? (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900">{currentTask.id}</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                  currentTask.priority === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                  currentTask.priority === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  currentTask.priority === 'medium' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  'bg-slate-200 text-slate-800'
                }`}>
                  {currentTask.priority}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-800">{currentTask.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">
                Location: ({Math.round(currentTask.location.x)}, {Math.round(currentTask.location.y)})
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 p-2 bg-slate-50 border border-slate-200 rounded-lg">No active task</p>
          )}
        </div>

        {/* Alerts */}
        {robot.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Alerts
            </h4>
            {robot.alerts.slice(-5).map((alert, i) => (
              <div key={i} className={`p-2 rounded-lg text-[10px] ${
                alert.severity === 'critical' ? 'bg-rose-50 text-rose-900 border border-rose-200' :
                alert.severity === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
