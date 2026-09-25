// ============================================================================
// KPI STATUS CARDS — Clean 6-Metric Executive Overview
// Features interactive fleet sizing directly on the Total Fleet card
// ============================================================================

'use client';

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Bot, Activity, Clock, Cpu, AlertTriangle, CheckCircle2
} from 'lucide-react';

export default function StatusCards() {
  const analytics = useFleetStore(s => s.analytics);
  const robots = useFleetStore(s => s.robots);
  const setRobotCount = useFleetStore(s => s.setRobotCount);

  const [customInput, setCustomInput] = React.useState(String(robots.length));

  React.useEffect(() => {
    setCustomInput(String(robots.length));
  }, [robots.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 1 && val <= 1000) {
      setRobotCount(val);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseInt(customInput, 10);
      if (!isNaN(val) && val >= 1) {
        setRobotCount(Math.min(1000, val));
      } else {
        setCustomInput(String(robots.length));
      }
    }
  };

  const handleInputBlur = () => {
    const val = parseInt(customInput, 10);
    if (isNaN(val) || val < 1) {
      setCustomInput(String(robots.length));
    } else {
      setRobotCount(Math.min(1000, val));
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Fleet Card with Direct Interactive Count Switcher */}
      <div className="relative overflow-hidden rounded-xl border-2 border-black bg-white p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-black font-extrabold">Total Fleet</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black font-mono text-black">{robots.length}</span>
              <span className="text-xs text-slate-700 font-mono font-bold">bots</span>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-100 border-2 border-black text-black">
            <Bot className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Quick Click Fleet Switcher */}
        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t-2 border-slate-200">
          {[5, 10, 50, 500].map(cnt => (
            <button
              key={cnt}
              id={`card-fleet-btn-${cnt}`}
              onClick={() => {
                setRobotCount(cnt);
                setCustomInput(String(cnt));
              }}
              title={`Switch fleet to ${cnt} robots`}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-extrabold transition-all border ${
                robots.length === cnt
                  ? 'bg-black text-white border-black shadow-xs scale-105'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:border-black hover:text-black'
              }`}
            >
              {cnt}
            </button>
          ))}
          <div className="flex items-center bg-slate-100 border-2 border-black rounded px-1.5 py-0.5" title="Type custom robot count">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customInput}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              placeholder="#"
              className="w-9 bg-transparent text-[11px] font-mono font-black text-black focus:outline-none text-center"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
      </div>

      {/* 2. Active Working Robots */}
      <div className="relative overflow-hidden rounded-xl border-2 border-black bg-white p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-black font-extrabold">Active Working</p>
            <p className="text-3xl font-black font-mono text-black mt-0.5">{analytics.activeRobots}</p>
            <p className="text-[11px] text-slate-700 mt-1 font-mono font-semibold">{analytics.robotUtilization}% fleet utilization</p>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-100 border-2 border-black text-black">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
      </div>

      {/* 3. Standby & Charging */}
      <div className="relative overflow-hidden rounded-xl border-2 border-black bg-white p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-black font-extrabold">Standby / Idle</p>
            <p className="text-3xl font-black font-mono text-black mt-0.5">{analytics.idleRobots}</p>
            <p className="text-[11px] text-slate-700 mt-1 font-mono font-semibold">{analytics.chargingRobots} charging • {analytics.lowBatteryRobots} low batt</p>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-100 border-2 border-black text-black">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
      </div>

      {/* 4. Active Tasks */}
      <div className="relative overflow-hidden rounded-xl border-2 border-black bg-white p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-black font-extrabold">Active Tasks</p>
            <p className="text-3xl font-black font-mono text-black mt-0.5">{analytics.activeTasks}</p>
            <p className="text-[11px] text-slate-700 mt-1 font-mono font-semibold">{analytics.completedTasks} completed</p>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-100 border-2 border-black text-black">
            <Cpu className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
      </div>

      {/* 5. System Alarms & Faults */}
      <div className={`relative overflow-hidden rounded-xl border-2 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        analytics.activeFaultsCount > 0
          ? 'border-rose-600 bg-rose-50/60'
          : 'border-black bg-white'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-black font-extrabold">System Alarms</p>
            <p className={`text-3xl font-black font-mono mt-0.5 ${analytics.activeFaultsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-black'}`}>
              {analytics.activeFaultsCount}
            </p>
            <p className="text-[11px] text-slate-700 mt-1 font-mono font-semibold">{analytics.sensorsAlertCount} sensor alarms</p>
          </div>
          <div className={`p-1.5 rounded-lg border-2 ${
            analytics.activeFaultsCount > 0
              ? 'bg-rose-100 border-rose-600 text-rose-700 animate-pulse'
              : 'bg-slate-100 border-black text-black'
          }`}>
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${analytics.activeFaultsCount > 0 ? 'bg-rose-600' : 'bg-black'}`} />
      </div>

      {/* 6. Autonomous Task Migrations */}
      <div className="relative overflow-hidden rounded-xl border-2 border-black bg-white p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-black font-extrabold">Task Failovers</p>
            <p className="text-3xl font-black font-mono text-black mt-0.5">{analytics.totalReassignments}</p>
            <p className="text-[11px] text-slate-700 mt-1 font-mono font-semibold">{analytics.totalRecoveries} recovered safely</p>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-100 border-2 border-black text-black">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
      </div>
    </div>
  );
}
