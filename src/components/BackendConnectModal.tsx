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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              connectionStatus === 'connected' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30'
            }`}>
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Backend Connectivity & Failover
              </h2>
              <p className="text-[11px] text-slate-400">
                Connect external ROS2/Python backend with automatic simulation fallback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Active Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            connectionStatus === 'connected'
              ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
              : connectionStatus === 'connecting'
              ? 'bg-amber-950/40 border-amber-700/50 text-amber-300'
              : 'bg-cyan-950/30 border-cyan-700/40 text-cyan-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
                'bg-cyan-400'
              }`} />
              <span className="font-semibold uppercase tracking-wider font-mono">
                Current Mode: {connectionStatus === 'simulated' ? 'Autonomous Simulation Engine' : connectionStatus.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono">
              Watchdog Active
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">
                WebSocket Telemetry Stream URL:
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8000/ws/telemetry"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Receives high-frequency robot telemetry and negotiation frames.
              </p>
            </div>

            <div>
              <label className="text-slate-400 font-semibold mb-1 block">
                REST API Base URL:
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Software Fallback Safety Guarantee */}
          <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1 text-slate-300">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Downtime Fallback Protection:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              If the backend server is offline, times out (4s), or disconnects mid-presentation, the built-in watchdog <strong>instantly switches back to the local 500-robot simulation</strong> with zero screen freeze or error popup.
            </p>
          </div>

          {testResult && (
            <p className="text-xs text-emerald-400 font-mono p-2 bg-slate-950 rounded border border-emerald-800/50">
              {testResult}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={handleSwitchToSim}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Force Simulation Mode</span>
          </button>

          <button
            onClick={handleConnect}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-cyan-900/40"
          >
            <span>Connect to Live Backend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
