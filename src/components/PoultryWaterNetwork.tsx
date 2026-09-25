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

  // Group pipes by Farm Zone (4 Sheds + 2 Pump Stations)
  const zones = ['Shed 1', 'Shed 2', 'Shed 3', 'Shed 4', 'Pump Station 1', 'Pump Station 2'];

  const blockedCount = waterPipes.filter(p => p.status !== 'normal').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-300 text-black">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black flex items-center gap-2">
              Poultry Water Manifold & Nipple Lines
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono">
                Step 27
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              12 High-pressure lines across 4 Broiler Sheds & 2 Pump Stations • Automated blockage dispatch
            </p>
          </div>
        </div>

        {/* Global Pipeline Health Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
            <span className="text-slate-500">Tank Alpha:</span>
            <span className="text-black font-bold">88%</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Tank Beta:</span>
            <span className="text-black font-bold">92%</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              blockedCount === 0
                ? 'bg-slate-100 text-slate-900 border border-slate-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
            }`}
          >
            {blockedCount === 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ALL 12 LINES NOMINAL</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{blockedCount} LINE BLOCKED</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 4 Sheds & 2 Pump Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map(shedName => {
          const shedPipes = waterPipes.filter(p => p.shed === shedName);
          return (
            <div
              key={shedName}
              className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                  {shedName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {shedName.startsWith('Pump') ? '2 Pump Lines' : '2 Nipple Lines'}
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
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isFaulty ? 'bg-rose-600 animate-ping' : 'bg-emerald-600'
                          }`}
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold truncate font-mono text-slate-900">
                            {pipe.name}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>{pipe.flowRate.toFixed(1)} L/m</span>
                            <span>•</span>
                            <span>{pipe.pressure.toFixed(1)} Bar</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isFaulty ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-mono font-bold">
                            BLOCKED
                          </span>
                        ) : (
                          <button
                            onClick={() => failWaterPipe(pipe.id)}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-[10px] font-mono transition font-medium"
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
