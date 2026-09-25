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
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Distributed Sensor Telemetry & Fault Incidents
          </h3>
          {activeFaultsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
              {activeFaultsCount} Active Faults
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* Sensor Grid */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <span>Live Industrial Sensors</span>
            <span className="text-slate-400 font-normal">Click "Simulate Fault" to trigger anomaly</span>
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
                      ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-white border border-slate-200">
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">{sensor.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{sensor.id}</p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-600 mb-2 truncate" title={sensor.zone}>
                    📍 {sensor.zone}
                  </p>

                  {/* Reading Gauge */}
                  <div className="flex items-baseline justify-between p-2 rounded-lg bg-white border border-slate-200 mb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Value:</span>
                    <span className={`text-lg font-bold font-mono ${
                      isCritical ? 'text-rose-600 animate-pulse' : isWarning ? 'text-amber-600' : 'text-slate-900'
                    }`}>
                      {sensor.currentValue} {sensor.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2.5">
                    <span>Nominal: {sensor.nominalRange[0]}–{sensor.nominalRange[1]} {sensor.unit}</span>
                    <span className="text-rose-600 font-medium">Limit: {sensor.criticalThreshold} {sensor.unit}</span>
                  </div>

                  {/* Simulate Fault Trigger */}
                  <button
                    onClick={() => triggerSensorFault(sensor.id)}
                    className="w-full py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-300 hover:border-rose-300 shadow-2xs transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
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
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Fault Incidents & Autonomous Response Matrix</span>
            </h4>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  filter === 'all' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({faults.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  filter === 'active' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Active ({activeFaultsCount})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  filter === 'resolved' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Resolved ({faults.length - activeFaultsCount})
              </button>
            </div>
          </div>

          {filteredFaults.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-1" />
              <p className="text-xs font-semibold text-slate-700">No active faults logged</p>
              <p className="text-[10px] text-slate-500">Click any sensor's "Simulate Anomaly" to test automatic multi-robot response</p>
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
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-rose-50/80 border-rose-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-black">{f.id}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${
                          f.severity === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">via {f.sensorName}</span>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                        isResolved
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : f.status === 'in-response'
                          ? 'bg-black text-white border border-black animate-pulse'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="text-xs mb-1.5">
                      <span className="text-rose-700 font-bold">Anomaly: {f.measuredValue}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-700 font-medium">Action: {f.requiredAction}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200 font-mono">
                      <span className="text-slate-500">Zone: {f.zone}</span>
                      {f.assignedRobotId ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">Response Agent:</span>
                          <button
                            onClick={() => selectRobot(f.assignedRobotId!)}
                            className="px-1.5 py-0.5 rounded font-bold text-black bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-colors"
                          >
                            {f.assignedRobotId}
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-700 text-[10px] font-bold">Negotiating allocation...</span>
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
