// ============================================================================
// SIMULATION CONTROLS — Start/Pause/Reset, Speed, Injection
// ============================================================================

'use client';

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Play, Pause, RotateCcw, Zap, AlertTriangle, Lock,
  Gauge, SkipForward, Bot
} from 'lucide-react';

export default function SimulationControls() {
  const config = useFleetStore(s => s.simulationConfig);
  const robots = useFleetStore(s => s.robots);
  const connectionStatus = useFleetStore(s => s.connectionStatus);
  const startSimulation = useFleetStore(s => s.startSimulation);
  const pauseSimulation = useFleetStore(s => s.pauseSimulation);
  const resumeSimulation = useFleetStore(s => s.resumeSimulation);
  const resetSimulation = useFleetStore(s => s.resetSimulation);
  const setSimulationSpeed = useFleetStore(s => s.setSimulationSpeed);
  const setRobotCount = useFleetStore(s => s.setRobotCount);
  const injectFailure = useFleetStore(s => s.injectFailure);
  const injectConflict = useFleetStore(s => s.injectConflict);
  const injectDeadlock = useFleetStore(s => s.injectDeadlock);

  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-slate-800">
      {/* Connection Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 mr-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
          connectionStatus === 'simulated' ? 'bg-slate-900 animate-pulse' :
          connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
          'bg-red-500'
        }`} />
        <span className="text-[10px] uppercase tracking-wider text-slate-700 font-bold">
          {connectionStatus === 'simulated' ? 'SIM MODE' : connectionStatus.toUpperCase()}
        </span>
      </div>

      {/* Primary Controls */}
      <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
        {config.state === 'stopped' ? (
          <button
            onClick={startSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        ) : config.state === 'running' ? (
          <button
            onClick={pauseSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : (
          <button
            onClick={resumeSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Resume
          </button>
        )}
        <button
          onClick={resetSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
        <Gauge className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] text-slate-500 mr-1 font-bold">SPEED</span>
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSimulationSpeed(s)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
              config.speed === s
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-black'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Injection Controls */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-500 mr-1 font-bold">INJECT</span>
        <button
          onClick={injectFailure}
          disabled={config.state !== 'running'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-300 text-red-600 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Zap className="w-3 h-3" />
          Failure
        </button>
        <button
          onClick={injectConflict}
          disabled={config.state !== 'running'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 border border-slate-300 text-amber-600 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <AlertTriangle className="w-3 h-3" />
          Conflict
        </button>
        <button
          onClick={injectDeadlock}
          disabled={config.state !== 'running'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-300 text-rose-600 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Lock className="w-3 h-3" />
          Deadlock
        </button>
      </div>

      {/* Simulation State Badge */}
      <div className="ml-auto">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
          {config.state}
        </span>
      </div>
    </div>
  );
}
