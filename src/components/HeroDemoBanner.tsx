// ============================================================================
// HERO DEMO BANNER — "The robot failed. The mission didn't." Interactive Storyline HUD
// ============================================================================

'use client';

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Flame, AlertTriangle, Handshake, Navigation,
  Zap, ArrowRightLeft, CheckCircle2, X, Sparkles, Trophy
} from 'lucide-react';
import { HeroDemoStep } from '@/types';

const STEPS: { id: HeroDemoStep; label: string; icon: React.ReactNode }[] = [
  { id: 'sensor-spike', label: '1. Sensor Spike', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'fault-triggered', label: '2. Fault & Task', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: 'robot-assigned', label: '3. Negotiation', icon: <Handshake className="w-3.5 h-3.5" /> },
  { id: 'conflict-reroute', label: '4. Reroute', icon: <Navigation className="w-3.5 h-3.5" /> },
  { id: 'robot-failure', label: '5. Robot Failure', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'task-migration', label: '6. Task Migration', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  { id: 'recovery-complete', label: '7. Mission Success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

export default function HeroDemoBanner() {
  const heroDemoState = useFleetStore(s => s.heroDemoState);
  const cancelHeroDemo = useFleetStore(s => s.cancelHeroDemo);
  const selectRobot = useFleetStore(s => s.selectRobot);

  if (!heroDemoState || !heroDemoState.isActive) return null;

  const currentIdx = STEPS.findIndex(s => s.id === heroDemoState.currentStep);
  const isFinished = heroDemoState.currentStep === 'recovery-complete';

  return (
    <div className={`p-3.5 rounded-2xl border transition-all shadow-2xl ${
      isFinished
        ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border-emerald-500/60 shadow-emerald-950/50'
        : heroDemoState.currentStep === 'robot-failure'
        ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-rose-500/60 shadow-rose-950/50'
        : 'bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-cyan-500/40 shadow-cyan-950/40'
    }`}>
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border flex items-center justify-center ${
            isFinished
              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
              : heroDemoState.currentStep === 'robot-failure'
              ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40'
          }`}>
            {isFinished ? <Trophy className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/40">
                Phase {heroDemoState.stepNumber} of {heroDemoState.totalSteps}
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {heroDemoState.title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              {heroDemoState.description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {heroDemoState.primaryRobotId && (
            <button
              onClick={() => selectRobot(heroDemoState.primaryRobotId!)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Inspect {heroDemoState.primaryRobotId}
            </button>
          )}
          {heroDemoState.backupRobotId && (
            <button
              onClick={() => selectRobot(heroDemoState.backupRobotId!)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/50 transition-colors"
            >
              Inspect {heroDemoState.backupRobotId}
            </button>
          )}
          <button
            onClick={cancelHeroDemo}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss Demo Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Progress Visualizer */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-2 border-t border-slate-800/80">
        {STEPS.map((s, idx) => {
          const isPassed = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={s.id}
              className={`p-1.5 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                isCurrent
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-900/50 scale-102'
                  : isPassed
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-semibold">
                {s.icon}
                <span className="truncate">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motto Banner when finished */}
      {isFinished && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-center animate-fade-in">
          <p className="text-sm font-extrabold text-emerald-300 tracking-wider uppercase font-mono">
            🎯 "The robot failed. The mission didn't."
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Decentralized task negotiation seamlessly rerouted, recovered, and resolved the critical thermal fault in 21 seconds with zero central controller dependency.
          </p>
        </div>
      )}
    </div>
  );
}
