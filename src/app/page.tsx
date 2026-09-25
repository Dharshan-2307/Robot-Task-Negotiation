// ============================================================================
// MISSION CONTROL DASHBOARD — Fault-Aware Decentralized Multi-Robot Engine
// ============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { globalTransport } from '@/lib/transport';
import FleetMap from '@/components/FleetMap';
import StatusCards from '@/components/StatusCards';
import SimulationControls from '@/components/SimulationControls';
import RobotDetailsPanel from '@/components/RobotDetailsPanel';
import TaskTable from '@/components/TaskTable';
import NegotiationMonitor from '@/components/NegotiationMonitor';
import ConflictDeadlockMonitor from '@/components/ConflictDeadlockMonitor';
import LiveEventFeed from '@/components/LiveEventFeed';
import CentralAlerts from '@/components/CentralAlerts';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import ImportDataModal from '@/components/ImportDataModal';
import SensorFaultPanel from '@/components/SensorFaultPanel';
import HeroDemoBanner from '@/components/HeroDemoBanner';
import BackendConnectModal from '@/components/BackendConnectModal';
import { JuryControlDeck } from '@/components/JuryControlDeck';
import { PoultryWaterNetwork } from '@/components/PoultryWaterNetwork';
import {
  Map, ListTodo, Handshake, ShieldAlert,
  BarChart3, Activity, Radio, Wifi, Terminal,
  FileSpreadsheet, Sparkles, Flame, Droplets
} from 'lucide-react';

export default function MissionControl() {
  const initializeSimulation = useFleetStore(s => s.initializeSimulation);
  const activeTab = useFleetStore(s => s.activeTab);
  const setActiveTab = useFleetStore(s => s.setActiveTab);
  const connectionStatus = useFleetStore(s => s.connectionStatus);
  const selectedRobotId = useFleetStore(s => s.selectedRobotId);
  const runHeroDemo = useFleetStore(s => s.runHeroDemo);
  const [rightPanelTab, setRightPanelTab] = useState<'details' | 'feed' | 'alerts'>('feed');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Initialize 500-robot simulation on startup
  useEffect(() => {
    initializeSimulation(500);
    useFleetStore.getState().startSimulation();

    return () => {
      globalTransport.destroy();
    };
  }, [initializeSimulation]);

  // If a robot is selected, switch right panel to details automatically
  useEffect(() => {
    if (selectedRobotId) {
      setRightPanelTab('details');
    }
  }, [selectedRobotId]);

  return (
    <div className="flex flex-col min-h-screen bg-[#080c14] text-slate-200">
      {/* Top Header / App Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider uppercase text-slate-100 font-mono">
                Agri<span className="text-emerald-400">Swarm</span>
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-emerald-300 border border-emerald-800/40">
                500-ROBOT POULTRY FARM ENGINE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Decentralized Multi-Robot Farm Utility Monitoring & Emergency Response System
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Poultry Farm Map
          </button>

          <button
            onClick={() => setActiveTab('water-network')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'water-network'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            Water Manifold
          </button>

          <button
            onClick={() => setActiveTab('sensors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'sensors'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Sensors & Faults
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'tasks'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Task Allocations
          </button>

          <button
            onClick={() => setActiveTab('negotiations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'negotiations'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            Negotiation Protocol
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'conflicts'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Conflict & Deadlocks
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics & Benchmarks
          </button>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2">
          {/* Launch Hero Demo Storyline Button */}
          <button
            onClick={() => runHeroDemo()}
            title="Launch live storyline: 'The robot failed. The mission didn't.'"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 via-amber-600 to-emerald-600 hover:brightness-110 text-white shadow-md shadow-rose-950/40 transition-all hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>Hero Demo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import custom fleet and task data from Excel, CSV, or Google Sheets"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Sheet</span>
          </button>

          {connectionStatus === 'simulated' ? (
            <button
              onClick={() => setIsBackendModalOpen(true)}
              title="Click to configure live backend connection or watchdog"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Sim Mode</span>
            </button>
          ) : (
            <button
              onClick={() => setIsBackendModalOpen(true)}
              title="Click to view live connection health or disconnect"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 transition-colors"
            >
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Backend</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        {/* KPI Status Row */}
        <StatusCards />

        {/* Step 24: Jury & Examiner Testing Deck */}
        <JuryControlDeck />

        {/* Hero Demo Storyline Banner (appears when hero demo is triggered) */}
        <HeroDemoBanner />

        {/* Simulation Controls Bar */}
        <SimulationControls />

        {/* Mobile Navigation Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/60">
          {(['dashboard', 'water-network', 'sensors', 'tasks', 'negotiations', 'conflicts', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab === 'dashboard' ? '2D Farm Map' : tab === 'water-network' ? 'Water Manifold' : tab === 'sensors' ? 'Sensors/Faults' : tab}
            </button>
          ))}
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[550px]">
          {/* Main Visualizer Area (8 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col h-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/40">
            {activeTab === 'dashboard' && (
              <div className="w-full h-full min-h-[520px]">
                <FleetMap />
              </div>
            )}
            {activeTab === 'water-network' && (
              <div className="w-full h-full min-h-[520px] p-2">
                <PoultryWaterNetwork />
              </div>
            )}
            {activeTab === 'sensors' && (
              <div className="w-full h-full min-h-[520px] p-2">
                <SensorFaultPanel />
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="w-full h-full min-h-[520px] p-2">
                <TaskTable />
              </div>
            )}
            {activeTab === 'negotiations' && (
              <div className="w-full h-full min-h-[520px] p-2">
                <NegotiationMonitor />
              </div>
            )}
            {activeTab === 'conflicts' && (
              <div className="w-full h-full min-h-[520px] p-2">
                <ConflictDeadlockMonitor />
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="w-full h-full min-h-[520px] p-2">
                <AnalyticsDashboard />
              </div>
            )}
          </div>

          {/* Right Inspector & Stream Panel (4 cols on desktop) */}
          <div className="lg:col-span-4 flex flex-col h-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/40">
            {/* Panel Selector Tab Header */}
            <div className="flex items-center justify-between p-1.5 border-b border-slate-800/80 bg-slate-950/60">
              <div className="flex items-center gap-1 w-full">
                <button
                  onClick={() => setRightPanelTab('details')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rightPanelTab === 'details'
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Robot Telemetry
                </button>
                <button
                  onClick={() => setRightPanelTab('feed')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rightPanelTab === 'feed'
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Feed
                </button>
                <button
                  onClick={() => setRightPanelTab('alerts')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rightPanelTab === 'alerts'
                      ? 'bg-slate-800 text-amber-400 border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Alerts
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelTab === 'details' && <RobotDetailsPanel />}
              {rightPanelTab === 'feed' && <LiveEventFeed />}
              {rightPanelTab === 'alerts' && <CentralAlerts />}
            </div>
          </div>
        </div>
      </main>

      {/* Import Data Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Backend Connectivity & Failover Watchdog Modal */}
      <BackendConnectModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
}
