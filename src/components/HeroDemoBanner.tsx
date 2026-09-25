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
    <div className={`p-3.5 rounded-2xl border transition-all shadow-md ${
      isFinished
        ? 'bg-emerald-50/90 border-emerald-300'
        : heroDemoState.currentStep === 'robot-failure'
        ? 'bg-rose-50/90 border-rose-300'
        : 'bg-white border-slate-300'
    }`}>
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border flex items-center justify-center ${
            isFinished
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : heroDemoState.currentStep === 'robot-failure'
              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
              : 'bg-black text-white border-black'
          }`}>
            {isFinished ? <Trophy className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                Phase {heroDemoState.stepNumber} of {heroDemoState.totalSteps}
              </span>
              <h3 className="text-sm font-bold text-black tracking-wide">
                {heroDemoState.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-snug">
              {heroDemoState.description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {heroDemoState.primaryRobotId && (
            <button
              onClick={() => selectRobot(heroDemoState.primaryRobotId!)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs transition-colors"
            >
              Inspect {heroDemoState.primaryRobotId}
            </button>
          )}
          {heroDemoState.backupRobotId && (
            <button
              onClick={() => selectRobot(heroDemoState.backupRobotId!)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs transition-colors"
            >
              Inspect {heroDemoState.backupRobotId}
            </button>
          )}
          <button
            onClick={cancelHeroDemo}
            className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
            title="Dismiss Demo Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Progress Visualizer */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-2 border-t border-slate-200">
        {STEPS.map((s, idx) => {
          const isPassed = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={s.id}
              className={`p-1.5 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                isCurrent
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : isPassed
                  ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px]">
                {s.icon}
                <span className="truncate">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motto Banner when finished */}
      {isFinished && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-center animate-fade-in">
          <p className="text-sm font-extrabold text-black tracking-wider uppercase font-mono">
            🎯 "The robot failed. The mission didn't."
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Decentralized task negotiation seamlessly rerouted, recovered, and resolved the critical thermal fault in 21 seconds with zero central controller dependency.
          </p>
        </div>
      )}
    </div>
  );
}
