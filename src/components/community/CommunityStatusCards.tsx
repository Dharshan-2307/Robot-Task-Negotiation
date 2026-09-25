'use client';

import React from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { 
  Truck, 
  Wrench, 
  ShieldAlert, 
  Zap, 
  Building2, 
  CheckCircle2,
  Clock,
  BatteryCharging
} from 'lucide-react';

export const CommunityStatusCards: React.FC = () => {
  const { robots, issues, buildings } = useCommunityStore();

  const totalRobots = robots.length;
  const activeRobots = robots.filter(r => r.state !== 'idle' && r.state !== 'failed').length;
  const failedRobots = robots.filter(r => r.state === 'failed').length;
  
  const pendingIssues = issues.filter(i => i.status !== 'resolved').length;
  const criticalIssues = issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  
  const deliveryRobots = robots.filter(r => r.role === 'parcel_delivery');
  const activeDeliveries = deliveryRobots.filter(r => r.state === 'delivering').length;

  const utilityRobots = robots.filter(r => r.role === 'plumbing_maintenance' || r.role === 'electrical_repair');
  const activeRepairs = utilityRobots.filter(r => r.state === 'repairing').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Fleet Total */}
      <div className="bg-white border-2 border-black p-3.5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-neutral-600 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Active Fleet</span>
          <Building2 className="w-4 h-4 text-black" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-black">{activeRobots}</span>
          <span className="text-xs text-neutral-500 font-semibold">/ {totalRobots} units</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-600">Standby: {totalRobots - activeRobots - failedRobots}</span>
          {failedRobots > 0 ? (
            <span className="text-black font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-black">
              {failedRobots} Fault
            </span>
          ) : (
            <span className="text-neutral-500 font-medium">0 Faults</span>
          )}
        </div>
      </div>

      {/* 2. Parcel & Door Deliveries */}
      <div className="bg-white border-2 border-black p-3.5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-neutral-600 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Door Deliveries</span>
          <Truck className="w-4 h-4 text-black" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-black">{activeDeliveries}</span>
          <span className="text-xs text-neutral-500 font-semibold">en route</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-600">Runners: {deliveryRobots.length}</span>
          <span className="text-neutral-800 font-semibold">Towers A-D</span>
        </div>
      </div>

      {/* 3. Open Resident Tickets */}
      <div className="bg-white border-2 border-black p-3.5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-neutral-600 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Facility Tickets</span>
          <Wrench className="w-4 h-4 text-black" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-black">{pendingIssues}</span>
          <span className="text-xs text-neutral-500 font-semibold">active</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-600">Resolved: {issues.filter(i => i.status === 'resolved').length}</span>
          {criticalIssues > 0 ? (
            <span className="font-bold text-black bg-neutral-200 px-1 rounded">
              {criticalIssues} Crit
            </span>
          ) : (
            <span className="text-neutral-500">Nominal</span>
          )}
        </div>
      </div>

      {/* 4. Utility & Plumbing */}
      <div className="bg-white border-2 border-black p-3.5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-neutral-600 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Basement & Pumps</span>
          <ShieldAlert className="w-4 h-4 text-black" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-black">{activeRepairs}</span>
          <span className="text-xs text-neutral-500 font-semibold">servicing</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-600">Pumps: 3x 50HP</span>
          <span className="font-bold text-black">Basement 1-2</span>
        </div>
      </div>

      {/* 5. EV Plaza & Microgrid */}
      <div className="bg-white border-2 border-black p-3.5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-neutral-600 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">EV Superchargers</span>
          <Zap className="w-4 h-4 text-black" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-black">12/12</span>
          <span className="text-xs text-neutral-500 font-semibold">bays live</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-600">Solar Gen: 42kW</span>
          <span className="text-neutral-800 font-semibold">Grid 100%</span>
        </div>
      </div>

      {/* 6. Response SLA */}
      <div className="bg-white border-2 border-black p-3.5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-neutral-600 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Dispatch SLA</span>
          <Clock className="w-4 h-4 text-black" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-black">1.8</span>
          <span className="text-xs text-neutral-500 font-semibold">min avg</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-600">P2P Failover: Auto</span>
          <span className="font-bold text-black">99.8%</span>
        </div>
      </div>
    </div>
  );
};
