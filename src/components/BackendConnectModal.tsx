// ============================================================================
// BACKEND CONNECTIVITY & FAILOVER MODAL — Live Server Input & Watchdog Status
// ============================================================================

'use client';

import React, { useState } from 'react';
import {
  X, Wifi, WifiOff, ShieldCheck, Terminal,
  Loader2, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { globalTransport } from '@/lib/transport';
import { useFleetStore } from '@/store/useFleetStore';

interface BackendConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackendConnectModal({ isOpen, onClose }: BackendConnectModalProps) {
  const connectionStatus = useFleetStore(s => s.connectionStatus);
  const [wsUrl, setWsUrl] = useState(globalTransport.config.wsUrl);
  const [apiUrl, setApiUrl] = useState(globalTransport.config.apiUrl);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = () => {
    setTestResult(null);
    globalTransport.updateUrls(apiUrl, wsUrl);
    globalTransport.connectLive(wsUrl);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSwitchToSim = () => {
    globalTransport.switchToSimulation();
    setTestResult('Switched to Autonomous Client Simulation Engine.');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              connectionStatus === 'connected' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-800 border-slate-300'
            }`}>
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
                Backend Connectivity & Failover
              </h2>
              <p className="text-[11px] text-slate-500">
                Connect external ROS2/Python backend with automatic simulation fallback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Active Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : connectionStatus === 'connecting'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-600 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-black'
              }`} />
              <span className="font-bold uppercase tracking-wider font-mono">
                Current Mode: {connectionStatus === 'simulated' ? 'Autonomous Simulation Engine' : connectionStatus.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-700">
              Watchdog Active
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-700 font-bold mb-1 block">
                WebSocket Telemetry Stream URL:
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8000/ws/telemetry"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-black focus:bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Receives high-frequency robot telemetry and negotiation frames.
              </p>
            </div>

            <div>
              <label className="text-slate-700 font-bold mb-1 block">
                REST API Base URL:
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-black focus:bg-white"
              />
            </div>
          </div>

          {/* Software Fallback Safety Guarantee */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
            <div className="flex items-center gap-1.5 text-black font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Downtime Fallback Protection:</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              If the backend server is offline, times out (4s), or disconnects mid-presentation, the built-in watchdog <strong>instantly switches back to the local 500-robot simulation</strong> with zero screen freeze or error popup.
            </p>
          </div>

          {testResult && (
            <p className="text-xs text-emerald-800 font-mono p-2 bg-emerald-50 rounded border border-emerald-300">
              {testResult}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleSwitchToSim}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Terminal className="w-3.5 h-3.5 text-black" />
            <span>Force Simulation Mode</span>
          </button>

          <button
            onClick={handleConnect}
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            <span>Connect to Live Backend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
