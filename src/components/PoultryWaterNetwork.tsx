'use client';

// ============================================================================
// POULTRY WATER NETWORK — Step 27 Nipple-Line Distribution & Manifold Monitor
// 12 Pipe Sections (Sheds 1-6) + Flow Rate + Pressure + Interactive Blockage Injection
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Droplets, AlertTriangle, CheckCircle2, Gauge, Activity, ShieldAlert,
  Play, Pause, ChevronLeft, ChevronRight, Sparkles, Thermometer, Zap
} from 'lucide-react';
import { WaterPipeSection } from '@/types';
import { DEFAULT_IOT_TELEMETRY } from '@/lib/sheetImporter';

export const PoultryWaterNetwork: React.FC = () => {
  const waterPipes = useFleetStore(s => s.waterPipes);
  const failWaterPipe = useFleetStore(s => s.failWaterPipe);
  const telemetryLogs = useFleetStore(s => s.telemetryLogs);
  const activeTelemetryIndex = useFleetStore(s => s.activeTelemetryIndex);
  const stepTelemetryLog = useFleetStore(s => s.stepTelemetryLog);
  const loadTelemetryLogs = useFleetStore(s => s.loadTelemetryLogs);

  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timer for streaming telemetry
  useEffect(() => {
    if (!isPlaying || telemetryLogs.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = (activeTelemetryIndex + 1) % telemetryLogs.length;
      stepTelemetryLog(nextIndex);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying, activeTelemetryIndex, telemetryLogs, stepTelemetryLog]);

  const activeLog = telemetryLogs[activeTelemetryIndex] || null;

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

      {/* IoT Telemetry Live Stream Player / Scrubber */}
      {telemetryLogs.length === 0 ? (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-slate-900">Synchronized Poultry Farm IoT Telemetry</p>
              <p className="text-[11px] text-slate-500">20 log entries of Date, Time, TEM1/2, Flow Switches S1/S2, Motor Relay, and Fault Status</p>
            </div>
          </div>
          <button
            onClick={() => loadTelemetryLogs(DEFAULT_IOT_TELEMETRY)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Load 20-Entry IoT Telemetry</span>
          </button>
        </div>
      ) : activeLog && (
        <div className="mb-4 p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
          {/* Top Scrubber Control Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-mono font-bold">
                LOG #{activeTelemetryIndex + 1}/{telemetryLogs.length}
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {activeLog.datetime}
              </span>
            </div>

            {/* Stepper Buttons & Auto-Play */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => stepTelemetryLog(activeTelemetryIndex - 1)}
                disabled={activeTelemetryIndex === 0}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition"
                title="Previous Reading"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  isPlaying ? 'bg-amber-500 text-black' : 'bg-black text-white'
                }`}
                title={isPlaying ? 'Pause log stream' : 'Auto-stream 20 logs'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Streaming' : 'Stream Logs'}</span>
              </button>
              <button
                onClick={() => stepTelemetryLog(activeTelemetryIndex + 1)}
                disabled={activeTelemetryIndex === telemetryLogs.length - 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition"
                title="Next Reading"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
            {/* 1. Temp */}
            <div className="p-2 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Dual Temp Probes</span>
              <span className="font-bold text-slate-900">{activeLog.tem1}°C / {activeLog.tem2}°C</span>
              <span className="text-[10px] text-slate-400 block">Avg: {activeLog.avgTem}°C</span>
            </div>

            {/* 2. Humidity */}
            <div className="p-2 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Humidity</span>
              <span className="font-bold text-cyan-700">{activeLog.humidity1}% / {activeLog.humidity2}%</span>
              <span className="text-[10px] text-slate-400 block">Brooder Section</span>
            </div>

            {/* 3. Flow Sensors S1 & S2 */}
            <div className="p-2 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">S1 & S2 Flow</span>
              <div className="flex items-center gap-1 font-bold">
                <span className={activeLog.s1 === 'WATER' ? 'text-emerald-700' : 'text-slate-400'}>S1:{activeLog.s1 === 'WATER' ? '💧' : '❌'}</span>
                <span>•</span>
                <span className={activeLog.s2 === 'WATER' ? 'text-emerald-700' : 'text-slate-400'}>S2:{activeLog.s2 === 'WATER' ? '💧' : '❌'}</span>
              </div>
            </div>

            {/* 4. Pump Motor */}
            <div className="p-2 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Pump Motor</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeLog.motor === 'ON' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                MOTOR {activeLog.motor}
              </span>
            </div>

            {/* 5. Status & Mode */}
            <div className="p-2 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">{activeLog.mode}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold truncate ${
                activeLog.status !== 'NORMAL' && activeLog.status !== 'PIPE_NORMAL'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : 'bg-emerald-50 text-emerald-800'
              }`}>
                {activeLog.status}
              </span>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={telemetryLogs.length - 1}
              value={activeTelemetryIndex}
              onChange={(e) => stepTelemetryLog(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>00:28:09 (Initial Sync)</span>
              <span>Slide timeline to scrub readings</span>
              <span>00:37:10 (Latest)</span>
            </div>
          </div>
        </div>
      )}

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
