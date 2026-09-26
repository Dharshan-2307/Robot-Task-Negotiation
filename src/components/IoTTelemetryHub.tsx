// ============================================================================
// IOT TELEMETRY HUB — Dedicated Live Google Sheets Telemetry & Incident Deck
// ============================================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Sparkles, Play, Pause, ChevronLeft, ChevronRight, Droplets,
  Thermometer, Zap, AlertTriangle, ShieldAlert, CheckCircle2,
  FileSpreadsheet, ArrowRight, RefreshCw, Cpu, Activity,
  Globe, Radio, Loader2, Link2, ExternalLink, Check, Edit2, AlertCircle
} from 'lucide-react';
import { DEFAULT_IOT_TELEMETRY, parseGoogleSheetUrl, applyImportedData } from '@/lib/sheetImporter';

interface IoTTelemetryHubProps {
  onOpenImportModal?: () => void;
}

export default function IoTTelemetryHub({ onOpenImportModal }: IoTTelemetryHubProps) {
  const telemetryLogs = useFleetStore(s => s.telemetryLogs);
  const activeTelemetryIndex = useFleetStore(s => s.activeTelemetryIndex);
  const stepTelemetryLog = useFleetStore(s => s.stepTelemetryLog);
  const loadTelemetryLogs = useFleetStore(s => s.loadTelemetryLogs);
  const setActiveTab = useFleetStore(s => s.setActiveTab);
  const robots = useFleetStore(s => s.robots);
  const tasks = useFleetStore(s => s.tasks);

  const [isPlaying, setIsPlaying] = useState(false);
  const [filterFaultsOnly, setFilterFaultsOnly] = useState(false);

  // --- Live Google Sheets Auto-Sync Engine ---
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agriswarm_iot_sheet_url') || '';
    }
    return '';
  });
  const [isUrlEditing, setIsUrlEditing] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [isLiveSyncing, setIsLiveSyncing] = useState(true);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastRowCount, setLastRowCount] = useState<number>(0);
  const isMountedRef = useRef(true);

  // Fetch the latest telemetry rows from the Google Sheet
  const fetchLatestFromSheet = async (targetUrl?: string) => {
    const url = (targetUrl || sheetUrl).trim();
    if (!url) return;

    setIsFetchingSheet(true);
    setSyncError(null);

    try {
      const res = await parseGoogleSheetUrl(url);
      if (!isMountedRef.current) return;

      if (res.errors && res.errors.length > 0) {
        setSyncError(res.errors[0]);
      } else if (res.telemetry && res.telemetry.length > 0) {
        // Load rows into Zustand store
        loadTelemetryLogs(res.telemetry);

        // Apply any generated emergency tasks (e.g. pipe damage, dry run)
        if (res.tasks && res.tasks.length > 0) {
          applyImportedData({ ...res, robots: [] });
        }

        // Jump immediately to the newest row uploaded by the IoT device
        stepTelemetryLog(res.telemetry.length - 1);
        setLastRowCount(res.telemetry.length);

        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setSyncError(err.message || 'Failed to sync Google Sheet');
      }
    } finally {
      if (isMountedRef.current) {
        setIsFetchingSheet(false);
      }
    }
  };

  // Continuous background auto-polling every 4 seconds
  useEffect(() => {
    isMountedRef.current = true;
    if (!isLiveSyncing || !sheetUrl.trim()) return;

    // Immediate initial sync
    fetchLatestFromSheet(sheetUrl);

    // Continuous 4-second poller
    const pollInterval = setInterval(() => {
      fetchLatestFromSheet(sheetUrl);
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
    };
  }, [isLiveSyncing, sheetUrl]);

  const handleSaveUrl = (newUrl: string) => {
    const cleaned = newUrl.trim();
    setSheetUrl(cleaned);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('agriswarm_iot_sheet_url', cleaned);
      } catch {}
    }
    setIsUrlEditing(false);
    if (cleaned) {
      setIsLiveSyncing(true);
      fetchLatestFromSheet(cleaned);
    }
  };

  // Auto-play timer (advances through the 20 rows every 2.5s)
  useEffect(() => {
    if (!isPlaying || telemetryLogs.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = (activeTelemetryIndex + 1) % telemetryLogs.length;
      stepTelemetryLog(nextIndex);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying, activeTelemetryIndex, telemetryLogs, stepTelemetryLog]);

  // If no logs yet, auto-populate with the 20 entries
  useEffect(() => {
    if (telemetryLogs.length === 0) {
      loadTelemetryLogs(DEFAULT_IOT_TELEMETRY);
    }
  }, [telemetryLogs.length, loadTelemetryLogs]);

  const logs = telemetryLogs.length > 0 ? telemetryLogs : DEFAULT_IOT_TELEMETRY;
  const activeLog = logs[activeTelemetryIndex] || logs[0];

  const displayedLogs = filterFaultsOnly
    ? logs.filter(l => l.status !== 'NORMAL' && l.status !== 'PIPE_NORMAL')
    : logs;

  const isFault = activeLog.status !== 'NORMAL' && activeLog.status !== 'PIPE_NORMAL';

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-black text-white shadow-xs">
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
                Poultry Farm IoT Telemetry Deck
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Google Sheets Feed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Synchronized 20-entry sensor log: W1209 Temp, Dual Flow Switches (S1/S2), Motor Relay & Fault Triggers
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
              <span>Import New Sheet</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            <span>View Fleet on Farm Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Live Google Sheets Cloud Stream Connector Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Connection Status / Input */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>

            {(!sheetUrl || isUrlEditing) ? (
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <input
                  type="url"
                  placeholder="Paste Google Sheets link (e.g. https://docs.google.com/spreadsheets/d/...)"
                  defaultValue={sheetUrl}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveUrl(urlInputValue || (e.target as HTMLInputElement).value);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveUrl(urlInputValue || sheetUrl)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-lg transition whitespace-nowrap"
                >
                  Connect & Stream
                </button>
                {sheetUrl && (
                  <button
                    onClick={() => setIsUrlEditing(false)}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    {isLiveSyncing ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                    )}
                  </span>
                  <span className="text-xs font-mono font-bold tracking-wide text-emerald-400">
                    {isLiveSyncing ? 'LIVE IOT FEED ACTIVE' : 'AUTO-SYNC PAUSED'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                  <span>•</span>
                  <span>{telemetryLogs.length} readings recorded</span>
                  {lastSyncTime && <span>• Last synced {lastSyncTime}</span>}
                  <button
                    onClick={() => {
                      setUrlInputValue(sheetUrl);
                      setIsUrlEditing(true);
                    }}
                    title="Change Google Sheet Link"
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white underline ml-1"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Change Link</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls (Auto-Sync Toggle & Refresh Now) */}
          {sheetUrl && !isUrlEditing && (
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                onClick={() => setIsLiveSyncing(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                  isLiveSyncing
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>Auto-Poll (4s): {isLiveSyncing ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => fetchLatestFromSheet()}
                disabled={isFetchingSheet}
                title="Fetch latest rows right now"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Sync Error Alert (if any) */}
        {syncError && (
          <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1 font-semibold">{syncError}</span>
            <button
              onClick={() => {
                setUrlInputValue(sheetUrl);
                setIsUrlEditing(true);
              }}
              className="text-[11px] font-bold underline hover:text-rose-950"
            >
              Verify Sheet Link
            </button>
          </div>
        )}

        {/* KPI Strip (Sync'd to Current Row) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Dual Temp */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
              <span>Dual Temp Probes</span>
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {activeLog.avgTem}°C
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between mt-1">
              <span>T1: {activeLog.tem1}°C</span>
              <span>T2: {activeLog.tem2}°C</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
              <span>Relative Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-700">
              {activeLog.humidity1}%
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between mt-1">
              <span>Probe 1: {activeLog.humidity1}%</span>
              <span>Probe 2: {activeLog.humidity2}%</span>
            </div>
          </div>

          {/* S1 & S2 Flow */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
              <span>Flow Switches</span>
              <Activity className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold font-mono mt-1">
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeLog.s1 === 'WATER' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                S1: {activeLog.s1 === 'WATER' ? 'FLOW' : 'EMPTY'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeLog.s2 === 'WATER' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                S2: {activeLog.s2 === 'WATER' ? 'FLOW' : 'EMPTY'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5">
              Differential Check: {activeLog.s1 === activeLog.s2 ? 'Balanced' : 'DIFF DETECTED!'}
            </div>
          </div>

          {/* Pump Motor */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
              <span>Pump Relay</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono">
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                activeLog.motor === 'ON' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                MOTOR {activeLog.motor}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              {activeLog.motor === 'ON' ? 'Pump Active & Pressurizing' : 'Pump Interrupted / Safe'}
            </div>
          </div>

          {/* Status & Mode */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
              <span>Operating Mode</span>
              <span className="font-bold text-slate-700">{activeLog.mode}</span>
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-1 rounded text-xs font-mono font-bold ${
                isFault
                  ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeLog.status}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              {isFault ? '⚠️ Emergency Task Dispatched' : 'System nominal'}
            </div>
          </div>
        </div>

        {/* Live Scrubber / Stream Player Deck */}
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-black text-white text-xs font-mono font-bold">
                LOG #{activeTelemetryIndex + 1} of {logs.length}
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                Timestamp: {activeLog.datetime}
              </span>
              {isFault && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                  CRITICAL FAULT DETECTED
                </span>
              )}
            </div>

            {/* Scrubber Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepTelemetryLog(activeTelemetryIndex - 1)}
                disabled={activeTelemetryIndex === 0}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-800 shadow-2xs transition"
                title="Previous Entry"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                  isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-black hover:bg-slate-800 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Auto-Stream' : 'Auto-Stream Telemetry (2.5s)'}</span>
              </button>

              <button
                onClick={() => stepTelemetryLog(activeTelemetryIndex + 1)}
                disabled={activeTelemetryIndex === logs.length - 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-800 shadow-2xs transition"
                title="Next Entry"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min="0"
              max={logs.length - 1}
              value={activeTelemetryIndex}
              onChange={(e) => stepTelemetryLog(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>00:28:09 (Initial Sync)</span>
              <span>Drag slider to travel across 20 log intervals</span>
              <span>00:37:10 (Latest Log)</span>
            </div>
          </div>
        </div>

        {/* Tabular View of All 20 Telemetry Rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Synchronized 20-Entry Google Sheet Telemetry Log
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any row to test & inspect
              </span>
            </div>

            <button
              onClick={() => setFilterFaultsOnly(!filterFaultsOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                filterFaultsOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {filterFaultsOnly ? 'Showing Fault Rows Only' : 'Filter: Show Fault Rows Only'}
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">ENTRY</th>
                    <th className="p-2.5">TIMESTAMP</th>
                    <th className="p-2.5">TEM1</th>
                    <th className="p-2.5">TEM2</th>
                    <th className="p-2.5">AVG TEMP</th>
                    <th className="p-2.5">HUM 1</th>
                    <th className="p-2.5">HUM 2</th>
                    <th className="p-2.5">S1 (INLET)</th>
                    <th className="p-2.5">S2 (OUTLET)</th>
                    <th className="p-2.5">MOTOR</th>
                    <th className="p-2.5">STATUS</th>
                    <th className="p-2.5">MODE</th>
                    <th className="p-2.5">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedLogs.map((row) => {
                    const rowIdx = logs.findIndex(l => l.id === row.id);
                    const isSelected = rowIdx === activeTelemetryIndex;
                    const rowIsFault = row.status !== 'NORMAL' && row.status !== 'PIPE_NORMAL';

                    return (
                      <tr
                        key={row.id}
                        onClick={() => stepTelemetryLog(rowIdx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-black text-white font-bold'
                            : rowIsFault
                            ? 'bg-rose-50/60 hover:bg-rose-100/60 text-slate-900'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <td className="p-2.5 font-bold">{row.id}</td>
                        <td className="p-2.5 whitespace-nowrap">{row.datetime}</td>
                        <td className="p-2.5">{row.tem1}°C</td>
                        <td className="p-2.5">{row.tem2}°C</td>
                        <td className="p-2.5">{row.avgTem}°C</td>
                        <td className="p-2.5">{row.humidity1}%</td>
                        <td className="p-2.5">{row.humidity2}%</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : row.s1 === 'WATER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {row.s1}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : row.s2 === 'WATER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {row.s2}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : row.motor === 'ON'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {row.motor}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : rowIsFault
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-2.5">{row.mode}</td>
                        <td className="p-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              stepTelemetryLog(rowIdx);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              isSelected
                                ? 'bg-white text-black'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {isSelected ? 'Active' : 'Apply'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
