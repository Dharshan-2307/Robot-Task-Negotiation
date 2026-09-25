// ============================================================================
// KPI STATUS CARDS — Fleet Overview Metrics
// ============================================================================

'use client';

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  Bot, Zap, Battery, AlertTriangle, CheckCircle2,
  Clock, XCircle, BatteryWarning, Activity, Cpu
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
  pulse?: boolean;
}

function StatCard({ label, value, icon, color, subtext, pulse }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-4 transition-all hover:border-slate-600/70 hover:bg-slate-800/80`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">{label}</p>
          <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          {subtext && <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-slate-800/50 ${pulse ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${color.includes('cyan') ? 'bg-cyan-500/30' : color.includes('amber') ? 'bg-amber-500/30' : color.includes('green') ? 'bg-green-500/30' : color.includes('red') ? 'bg-red-500/30' : 'bg-slate-500/30'}`} />
    </div>
  );
}

export default function StatusCards() {
  const analytics = useFleetStore(s => s.analytics);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3">
      <StatCard
        label="Total Fleet"
        value={analytics.totalRobots}
        icon={<Bot className="w-5 h-5 text-cyan-400" />}
        color="text-cyan-400"
      />
      <StatCard
        label="Active"
        value={analytics.activeRobots}
        icon={<Activity className="w-5 h-5 text-emerald-400" />}
        color="text-emerald-400"
      />
      <StatCard
        label="Idle"
        value={analytics.idleRobots}
        icon={<Clock className="w-5 h-5 text-amber-400" />}
        color="text-amber-400"
      />
      <StatCard
        label="Charging"
        value={analytics.chargingRobots}
        icon={<Zap className="w-5 h-5 text-lime-400" />}
        color="text-lime-400"
      />
      <StatCard
        label="Failed"
        value={analytics.failedRobots}
        icon={<XCircle className="w-5 h-5 text-red-400" />}
        color="text-red-400"
        pulse={analytics.failedRobots > 0}
      />
      <StatCard
        label="Low Battery"
        value={analytics.lowBatteryRobots}
        icon={<BatteryWarning className="w-5 h-5 text-orange-400" />}
        color="text-orange-400"
        pulse={analytics.lowBatteryRobots > 3}
      />
      <StatCard
        label="Sensor Alarms"
        value={analytics.sensorsAlertCount}
        icon={<Activity className="w-5 h-5 text-rose-400" />}
        color="text-rose-400"
        pulse={analytics.sensorsAlertCount > 0}
      />
      <StatCard
        label="Active Faults"
        value={analytics.activeFaultsCount}
        icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        color="text-red-400"
        pulse={analytics.activeFaultsCount > 0}
      />
      <StatCard
        label="Active Tasks"
        value={analytics.activeTasks}
        icon={<Cpu className="w-5 h-5 text-blue-400" />}
        color="text-blue-400"
      />
      <StatCard
        label="Completed"
        value={analytics.completedTasks}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        color="text-emerald-400"
      />
      <StatCard
        label="Task Migrations"
        value={analytics.totalReassignments}
        icon={<CheckCircle2 className="w-5 h-5 text-amber-400" />}
        color="text-amber-400"
      />
    </div>
  );
}
