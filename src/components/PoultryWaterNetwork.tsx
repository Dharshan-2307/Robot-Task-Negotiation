'use client';

// ============================================================================
// POULTRY WATER NETWORK — Step 27 Nipple-Line Distribution & Manifold Monitor
// 12 Pipe Sections (Sheds 1-6) + Flow Rate + Pressure + Interactive Blockage Injection
// ============================================================================

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { Droplets, AlertTriangle, CheckCircle2, Gauge, Activity, ShieldAlert } from 'lucide-react';
import { WaterPipeSection } from '@/types';

export const PoultryWaterNetwork: React.FC = () => {
  const waterPipes = useFleetStore(s => s.waterPipes);
  const failWaterPipe = useFleetStore(s => s.failWaterPipe);

  // Group pipes by Shed
  const sheds = ['Shed 1', 'Shed 2', 'Shed 3', 'Shed 4', 'Shed 5', 'Shed 6'];

  const blockedCount = waterPipes.filter(p => p.status !== 'normal').length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Poultry Water Manifold & Nipple Lines
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Step 27
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              12 High-pressure lines across 6 broiler sheds • Automated blockage dispatch
            </p>
          </div>
        </div>

        {/* Global Pipeline Health Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">Tank Alpha:</span>
            <span className="text-emerald-400 font-bold">88%</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Tank Beta:</span>
            <span className="text-emerald-400 font-bold">92%</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              blockedCount === 0
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/50 animate-pulse'
            }`}
          >
            {blockedCount === 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ALL 12 LINES NOMINAL</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{blockedCount} LINE BLOCKED</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 6 Sheds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sheds.map(shedName => {
          const shedPipes = waterPipes.filter(p => p.shed === shedName);
          return (
            <div
              key={shedName}
              className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  {shedName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  2 Nipple Lines
                </span>
              </div>

              <div className="space-y-2">
                {shedPipes.map(pipe => {
                  const isFaulty = pipe.status !== 'normal';
                  return (
                    <div
                      key={pipe.id}
                      className={`p-2 rounded-md border transition flex items-center justify-between gap-2 ${
                        isFaulty
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isFaulty ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                          }`}
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate font-mono">
                            {pipe.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{pipe.flowRate.toFixed(1)} L/m</span>
                            <span>•</span>
                            <span>{pipe.pressure.toFixed(1)} Bar</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isFaulty ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50 text-[10px] font-mono font-bold">
                            BLOCKED
                          </span>
                        ) : (
                          <button
                            onClick={() => failWaterPipe(pipe.id)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-[10px] font-mono transition"
                            title={`Simulate nipple line blockage in ${pipe.name}`}
                          >
                            Fail Line
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
