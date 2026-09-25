// ============================================================================
// SENSORS & ACTIVE FAULTS PANEL — Distributed Sensor Grid & Fault Incidents
// ============================================================================

'use client';

import React, { useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Thermometer, Droplets, Zap, Activity, AlertOctagon,
  CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight,
  RefreshCw, Radio
} from 'lucide-react';
import { SensorUnit, SensorType } from '@/types';

function getSensorIcon(type: SensorType) {
  switch (type) {
    case 'W1209-temp': return <Thermometer className="w-4 h-4 text-red-400" />;
    case 'water-blockage': return <Droplets className="w-4 h-4 text-cyan-400" />;
    case 'water-leak': return <Droplets className="w-4 h-4 text-blue-400" />;
    case 'power-pzem': return <Zap className="w-4 h-4 text-amber-400" />;
    case 'vibration': return <Activity className="w-4 h-4 text-purple-400" />;
    default: return <Radio className="w-4 h-4 text-slate-400" />;
  }
}

export default function SensorFaultPanel() {
  const sensors = useFleetStore(s => s.sensors);
  const faults = useFleetStore(s => s.faults);
  const triggerSensorFault = useFleetStore(s => s.triggerSensorFault);
  const selectRobot = useFleetStore(s => s.selectRobot);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const filteredFaults = faults
    .filter(f => filter === 'all' ? true : filter === 'active' ? f.status !== 'resolved' : f.status === 'resolved')
    .slice(-30)
    .reverse();

  const activeFaultsCount = faults.filter(f => f.status !== 'resolved').length;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Distributed Sensor Telemetry & Fault Incidents
          </h3>
          {activeFaultsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-900/60 text-rose-300 border border-rose-700/50 animate-pulse">
              {activeFaultsCount} Active Faults
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* Sensor Grid */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Live Industrial Sensors</span>
            <span className="text-slate-500 font-normal">Click "Simulate Fault" to trigger anomaly</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sensors.map(sensor => {
              const isCritical = sensor.status === 'critical';
              const isWarning = sensor.status === 'warning';

              return (
                <div
                  key={sensor.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-rose-950/30 border-rose-700/60 shadow-lg shadow-rose-950/40'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-700/50'
                      : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-slate-900/60 border border-slate-700/50">
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200 leading-tight">{sensor.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{sensor.id}</p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded ${
                      isCritical
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60 animate-pulse'
                        : isWarning
                        ? 'bg-amber-900/50 text-amber-300'
                        : 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-2 truncate" title={sensor.zone}>
                    📍 {sensor.zone}
                  </p>

                  {/* Reading Gauge */}
                  <div className="flex items-baseline justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800/60 mb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Value:</span>
                    <span className={`text-lg font-bold font-mono ${
                      isCritical ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {sensor.currentValue} {sensor.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2.5">
                    <span>Nominal: {sensor.nominalRange[0]}–{sensor.nominalRange[1]} {sensor.unit}</span>
                    <span className="text-rose-400/80">Threshold: {sensor.criticalThreshold} {sensor.unit}</span>
                  </div>

                  {/* Simulate Fault Trigger */}
                  <button
                    onClick={() => triggerSensorFault(sensor.id)}
                    className="w-full py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 bg-slate-700/40 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-600/40 hover:border-rose-700/50 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Simulate Anomaly / Fault</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fault Incidents Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Fault Incidents & Autonomous Response Matrix</span>
            </h4>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                All ({faults.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filter === 'active' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Active ({activeFaultsCount})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filter === 'resolved' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Resolved ({faults.length - activeFaultsCount})
              </button>
            </div>
          </div>

          {filteredFaults.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-800/20 text-slate-500">
              <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mb-1" />
              <p className="text-xs">No active faults logged</p>
              <p className="text-[10px] text-slate-600">Click any sensor's "Simulate Anomaly" to test automatic multi-robot response</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFaults.map(f => {
                const isResolved = f.status === 'resolved';

                return (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isResolved
                        ? 'bg-slate-800/30 border-slate-700/40 text-slate-400'
                        : 'bg-rose-950/20 border-rose-800/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">{f.id}</span>
                        <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded border ${
                          f.severity === 'critical' ? 'bg-rose-900/40 text-rose-300 border-rose-700/40' : 'bg-amber-900/40 text-amber-300 border-amber-700/40'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">via {f.sensorName}</span>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                        isResolved
                          ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30'
                          : f.status === 'in-response'
                          ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/40 animate-pulse'
                          : 'bg-rose-900/40 text-rose-300 border border-rose-700/40'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="text-xs mb-1.5">
                      <span className="text-rose-400 font-semibold">Anomaly: {f.measuredValue}</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="text-slate-300">Action: {f.requiredAction}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60 font-mono">
                      <span className="text-slate-500">Zone: {f.zone}</span>
                      {f.assignedRobotId ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">Response Agent:</span>
                          <button
                            onClick={() => selectRobot(f.assignedRobotId!)}
                            className="px-1.5 py-0.2 rounded font-bold text-cyan-400 bg-slate-800 hover:bg-cyan-900/40 border border-slate-700 hover:border-cyan-700 transition-colors"
                          >
                            {f.assignedRobotId}
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-400 text-[10px]">Negotiating allocation...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
