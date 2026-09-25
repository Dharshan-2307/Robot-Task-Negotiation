// ============================================================================
// SIMULATION CONTROLS — Start/Pause/Reset, Speed, Injection
// ============================================================================

'use client';

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Play, Pause, RotateCcw, Zap, AlertTriangle, Lock,
  Gauge, SkipForward
} from 'lucide-react';

export default function SimulationControls() {
  const config = useFleetStore(s => s.simulationConfig);
  const connectionStatus = useFleetStore(s => s.connectionStatus);
  const startSimulation = useFleetStore(s => s.startSimulation);
  const pauseSimulation = useFleetStore(s => s.pauseSimulation);
  const resumeSimulation = useFleetStore(s => s.resumeSimulation);
  const resetSimulation = useFleetStore(s => s.resetSimulation);
  const setSimulationSpeed = useFleetStore(s => s.setSimulationSpeed);
  const injectFailure = useFleetStore(s => s.injectFailure);
  const injectConflict = useFleetStore(s => s.injectConflict);
  const injectDeadlock = useFleetStore(s => s.injectDeadlock);

  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
      {/* Connection Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/30 mr-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
          connectionStatus === 'simulated' ? 'bg-cyan-400 animate-pulse' :
          connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
          'bg-red-400'
        }`} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          {connectionStatus === 'simulated' ? 'SIM MODE' : connectionStatus.toUpperCase()}
        </span>
      </div>

      {/* Primary Controls */}
      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-3">
        {config.state === 'stopped' ? (
          <button
            onClick={startSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        ) : config.state === 'running' ? (
          <button
            onClick={pauseSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : (
          <button
            onClick={resumeSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Resume
          </button>
        )}
        <button
          onClick={resetSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-3">
        <Gauge className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] text-slate-500 mr-1">SPEED</span>
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSimulationSpeed(s)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
              config.speed === s
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Injection Controls */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-500 mr-1">INJECT</span>
        <button
          onClick={injectFailure}
          disabled={config.state !== 'running'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-800/30 text-red-400 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Zap className="w-3 h-3" />
          Failure
        </button>
        <button
          onClick={injectConflict}
          disabled={config.state !== 'running'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-900/30 hover:bg-orange-900/50 border border-orange-800/30 text-orange-400 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <AlertTriangle className="w-3 h-3" />
          Conflict
        </button>
        <button
          onClick={injectDeadlock}
          disabled={config.state !== 'running'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 border border-rose-800/30 text-rose-400 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Lock className="w-3 h-3" />
          Deadlock
        </button>
      </div>

      {/* Simulation State Badge */}
      <div className="ml-auto">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          config.state === 'running' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30' :
          config.state === 'paused' ? 'bg-amber-900/40 text-amber-400 border border-amber-700/30' :
          'bg-slate-800/40 text-slate-400 border border-slate-700/30'
        }`}>
          {config.state}
        </span>
      </div>
    </div>
  );
}
