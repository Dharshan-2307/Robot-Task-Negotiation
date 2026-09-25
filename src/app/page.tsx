// ============================================================================
// MISSION CONTROL DASHBOARD — Fault-Aware Decentralized Multi-Robot Engine
// ============================================================================

'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
import { PoultryWaterNetwork } from '@/components/PoultryWaterNetwork';
import {
  Map, ListTodo, Handshake, ShieldAlert,
  BarChart3, Activity, Radio, Wifi, Terminal,
  FileSpreadsheet, Sparkles, Flame, Droplets, ChevronDown,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function MissionControl() {
  const initializeSimulation = useFleetStore(s => s.initializeSimulation);
  const robots = useFleetStore(s => s.robots);
  const activeTab = useFleetStore(s => s.activeTab);
  const setActiveTab = useFleetStore(s => s.setActiveTab);
  const connectionStatus = useFleetStore(s => s.connectionStatus);
  const selectedRobotId = useFleetStore(s => s.selectedRobotId);
  const runHeroDemo = useFleetStore(s => s.runHeroDemo);
  const faults = useFleetStore(s => s.faults);
  const conflicts = useFleetStore(s => s.conflicts);
  const tasks = useFleetStore(s => s.tasks);

  const [rightPanelTab, setRightPanelTab] = useState<'details' | 'feed' | 'alerts'>('feed');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isSimControlsOpen, setIsSimControlsOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isMoreModulesOpen, setIsMoreModulesOpen] = useState(false);
  const moreModulesRef = useRef<HTMLDivElement>(null);

  const activeFaultsCount = faults.filter(f => f.status !== 'resolved').length;
  const activeConflictsCount = conflicts.filter(c => c.status !== 'resolved').length;

  const secondaryTabNames: Record<string, string> = {
    'sensors': 'Sensors & Faults',
    'tasks': 'Task Allocation',
    'conflicts': 'Conflicts & Safety',
    'analytics': 'Analytics & SLA',
  };
  const isSecondaryActive = ['sensors', 'tasks', 'conflicts', 'analytics'].includes(activeTab);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreModulesRef.current && !moreModulesRef.current.contains(e.target as Node)) {
        setIsMoreModulesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize simulation on startup (persists user's selected fleet count across reloads)
  useEffect(() => {
    initializeSimulation();
    useFleetStore.getState().startSimulation();

    return () => {
      globalTransport.destroy();
    };
  }, [initializeSimulation]);

  // If a robot is selected, switch right panel to details automatically and open if closed
  useEffect(() => {
    if (selectedRobotId) {
      setRightPanelTab('details');
      setIsRightPanelOpen(true);
    }
  }, [selectedRobotId]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header / App Bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 text-black shadow-xs">
            <Radio className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black tracking-wide uppercase text-black font-mono">
                Agri<span className="text-slate-500">Swarm</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
                {robots.length}-ROBOT POULTRY FARM ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Decentralized Multi-Robot Farm Utility Monitoring & Autonomous Emergency Response System
            </p>
          </div>
        </div>

        {/* Environment Switcher: Poultry Farm vs Gated Community (Completely Isolated) */}
        <div className="hidden md:flex items-center border border-slate-300 p-0.5 rounded-lg bg-slate-100">
          <div className="px-2.5 py-1 text-xs font-bold bg-black text-white rounded-md flex items-center gap-1.5 shadow-xs">
            <span>🐔</span>
            <span>Poultry Farm</span>
          </div>
          <Link
            href="/community"
            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-black hover:bg-white rounded-md transition-all flex items-center gap-1.5"
            title="Switch to Isolated Gated Community Multi-Robot Engine"
          >
            <span>🏢</span>
            <span>Gated Community</span>
            <span className="text-[9px] bg-slate-200 px-1 py-0.2 rounded font-mono text-black font-bold">ISOLATED</span>
          </Link>
        </div>

        {/* Center Navigation Tabs — 3 Pillars + Categorized 'More Modules' Dropdown */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-white/80'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Poultry Farm Map
          </button>

          <button
            onClick={() => setActiveTab('negotiations')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'negotiations'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-white/80'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            Task Negotiation
          </button>

          <button
            onClick={() => setActiveTab('water-network')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'water-network'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-white/80'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            Water & Pumps
          </button>

          {/* Categorized 'More Modules' Dropdown */}
          <div ref={moreModulesRef} className="relative">
            <button
              onClick={() => setIsMoreModulesOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                isSecondaryActive
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-white/80 border-transparent'
              }`}
            >
              <span>{isSecondaryActive ? secondaryTabNames[activeTab] || 'More Modules' : 'More Modules'}</span>
              {(activeFaultsCount > 0 || activeConflictsCount > 0) && !isSecondaryActive && (
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreModulesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreModulesOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border-2 border-black rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Additional Modules
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">4 views</span>
                </div>

                {/* 1. Sensors */}
                <button
                  onClick={() => {
                    setActiveTab('sensors');
                    setIsMoreModulesOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors mb-1 ${
                    activeTab === 'sensors'
                      ? 'bg-black text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Sensors & Faults</p>
                      <p className={`text-[10px] ${activeTab === 'sensors' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Telemetry & Anomaly Grid
                      </p>
                    </div>
                  </div>
                  {activeFaultsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                      {activeFaultsCount} active
                    </span>
                  )}
                </button>

                {/* 2. Tasks */}
                <button
                  onClick={() => {
                    setActiveTab('tasks');
                    setIsMoreModulesOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors mb-1 ${
                    activeTab === 'tasks'
                      ? 'bg-black text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Task Allocation</p>
                      <p className={`text-[10px] ${activeTab === 'tasks' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Filterable Tasks Directory
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${activeTab === 'tasks' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {tasks.length} tasks
                  </span>
                </button>

                {/* 3. Conflicts */}
                <button
                  onClick={() => {
                    setActiveTab('conflicts');
                    setIsMoreModulesOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors mb-1 ${
                    activeTab === 'conflicts'
                      ? 'bg-black text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Conflicts & Safety</p>
                      <p className={`text-[10px] ${activeTab === 'conflicts' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Collision & Deadlock Recovery
                      </p>
                    </div>
                  </div>
                  {activeConflictsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {activeConflictsCount} active
                    </span>
                  )}
                </button>

                {/* 4. Analytics */}
                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setIsMoreModulesOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-black text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Analytics & Benchmarks</p>
                      <p className={`text-[10px] ${activeTab === 'analytics' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Contract-Net SLA Latency
                      </p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    Step 25
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2">
          {/* Launch Hero Demo Storyline Button */}
          <button
            onClick={() => runHeroDemo()}
            title="Launch live storyline: 'The robot failed. The mission didn't.'"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-black hover:bg-slate-800 text-white shadow-xs transition-all hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Hero Demo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import custom fleet and task data"
            className="p-1.5 rounded-lg text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-800" />
          </button>

          {/* Top-Right Simulation Controls Toggle */}
          <button
            onClick={() => setIsSimControlsOpen(prev => !prev)}
            title="Toggle simulation controls & fault injection"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              isSimControlsOpen
                ? 'bg-black border-black text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sim Controls</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSimControlsOpen ? 'rotate-180 text-white' : 'text-slate-500'}`} />
          </button>
        </div>
      </header>

      {/* Slide-Down Simulation Controls Drawer */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden bg-white border-b border-slate-200 shadow-md px-5 ${
          isSimControlsOpen ? 'max-h-36 py-2.5 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <SimulationControls />
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
        {/* KPI Status Row */}
        <StatusCards />

        {/* Hero Demo Storyline Banner (appears when hero demo is triggered) */}
        <HeroDemoBanner />

        {/* Mobile Navigation Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {[
            { id: 'dashboard', label: 'Farm Map' },
            { id: 'negotiations', label: 'Negotiation' },
            { id: 'water-network', label: 'Water' },
            { id: 'sensors', label: 'Sensors' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'conflicts', label: 'Conflicts' },
            { id: 'analytics', label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-black text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            href="/community"
            className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-white text-black border border-slate-300 flex items-center gap-1 shadow-xs hover:bg-slate-200"
          >
            <span>🏢</span>
            <span>Gated Community</span>
          </Link>
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[550px]">
          {/* Main Visualizer Area (8 cols on desktop when panel open, 12 cols full width when closed) */}
          <div className={`${isRightPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'} relative flex flex-col h-full rounded-xl overflow-hidden border-2 border-black bg-white shadow-sm transition-all duration-300`}>
            {/* If right panel is closed, show a floating button to re-open it smoothly */}
            {!isRightPanelOpen && (
              <div className="absolute top-2.5 right-2.5 z-20">
                <button
                  onClick={() => setIsRightPanelOpen(true)}
                  title="Open Telemetry, Live Event Feed & Alerts"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-md transition-all hover:scale-105 active:scale-95 group"
                >
                  <Activity className="w-3.5 h-3.5 text-black" />
                  <span className="font-mono text-[11px] font-bold tracking-wide">Inspector & Feed</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

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

          {/* Right Inspector & Stream Panel (4 cols on desktop, kept mounted so all background functions/subscriptions run uninterrupted) */}
          <div className={`${isRightPanelOpen ? 'lg:col-span-4 flex' : 'hidden'} flex-col h-full rounded-xl overflow-hidden border-2 border-black bg-white shadow-sm transition-all duration-300`}>
            {/* Panel Selector Tab Header */}
            <div className="flex items-center justify-between p-1.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setRightPanelTab('details')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rightPanelTab === 'details'
                      ? 'bg-white text-black border border-slate-300 shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Robot Telemetry
                </button>
                <button
                  onClick={() => setRightPanelTab('feed')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rightPanelTab === 'feed'
                      ? 'bg-white text-black border border-slate-300 shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Live Feed
                </button>
                <button
                  onClick={() => setRightPanelTab('alerts')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rightPanelTab === 'alerts'
                      ? 'bg-white text-black border border-slate-300 shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Alerts
                </button>
              </div>

              {/* Close / Collapse button */}
              <button
                onClick={() => setIsRightPanelOpen(false)}
                title="Collapse sidebar panel (Expands map to full width)"
                className="p-1.5 ml-1 rounded-lg text-slate-500 hover:text-black hover:bg-slate-200/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
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

      {/* Floating Bottom-Right Backend / Sim Mode Switcher */}
      <div className="fixed bottom-4 right-4 z-40">
        {connectionStatus === 'simulated' ? (
          <button
            onClick={() => setIsBackendModalOpen(true)}
            title="Click to configure live backend connection or watchdog"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
            <Terminal className="w-3.5 h-3.5 text-black" />
            <span className="font-bold">Sim Mode</span>
          </button>
        ) : (
          <button
            onClick={() => setIsBackendModalOpen(true)}
            title="Click to view live connection health or disconnect"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-white hover:bg-slate-50 border border-emerald-600 text-emerald-800 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-bold">Live Backend</span>
          </button>
        )}
      </div>
    </div>
  );
}
