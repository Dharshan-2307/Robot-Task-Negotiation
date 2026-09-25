'use client';

import React from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { 
  Package, 
  Droplets, 
  Trash2, 
  ZapOff, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Pause,
  FastForward,
  Cpu
} from 'lucide-react';
import { IssueCategory } from '@/types/community';

export const CommunityIssuePanel: React.FC = () => {
  const { 
    isSimRunning, 
    simSpeed, 
    toggleSimulation, 
    setSimSpeed, 
    triggerCommunityIssue,
    robots,
    setRobotCount,
    failCommunityRobot,
    recoverCommunityRobot
  } = useCommunityStore();

  const handleTrigger = (cat: IssueCategory) => {
    triggerCommunityIssue(cat);
  };

  const activeBots = robots.filter(r => r.state !== 'failed');
  const failedBots = robots.filter(r => r.state === 'failed');

  const handleFailRandom = () => {
    const candidate = activeBots.find(r => r.state === 'delivering' || r.state === 'repairing') || activeBots[0];
    if (candidate) {
      failCommunityRobot(candidate.id);
    }
  };

  const handleRecoverAll = () => {
    failedBots.forEach(b => recoverCommunityRobot(b.id));
  };

  return (
    <div className="bg-white border-2 border-black p-4 shadow-sm mb-6">
      {/* Header & Simulation Speed controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black mb-4">
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-black" />
            Apartment Multi-Robot Dispatch & Incident Simulator
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Trigger facility events or test peer-to-peer negotiation & fault failovers
          </p>
        </div>

        {/* Speed, Fleet Size & Sim Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fleet Count Selector */}
          <div className="flex items-center border-2 border-black bg-white">
            <span className="px-2 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fleet</span>
            {[1, 3, 5, 10, 20].map(cnt => (
              <button
                key={cnt}
                onClick={() => setRobotCount(cnt)}
                title={`Scale community fleet to ${cnt} robots`}
                className={`px-2 py-1 text-xs font-bold border-l border-neutral-300 transition-colors ${
                  robots.length === cnt ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>

          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 border-2 border-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isSimRunning ? 'bg-black text-white hover:bg-neutral-800' : 'bg-neutral-100 text-black hover:bg-neutral-200'
            }`}
          >
            {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimRunning ? 'Pause Engine' : 'Resume Engine'}
          </button>

          <div className="flex items-center border-2 border-black bg-white">
            <button
              onClick={() => setSimSpeed(1)}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                simSpeed === 1 ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setSimSpeed(2)}
              className={`px-2.5 py-1 text-xs font-bold border-l border-neutral-300 transition-colors ${
                simSpeed === 2 ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
            >
              2x
            </button>
            <button
              onClick={() => setSimSpeed(5)}
              className={`px-2.5 py-1 text-xs font-bold border-l border-neutral-300 transition-colors ${
                simSpeed === 5 ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
            >
              5x
            </button>
          </div>
        </div>
      </div>

      {/* Incident Trigger Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Parcel Delivery */}
        <button
          onClick={() => handleTrigger('package_delivery')}
          className="p-3 border-2 border-black bg-white hover:bg-neutral-50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-black mb-1.5">
            <Package className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1 py-0.5 border border-black">GATE 1</span>
          </div>
          <div>
            <div className="text-xs font-black text-black">Deliver Parcel</div>
            <div className="text-[10px] text-neutral-600 line-clamp-1">Courier Hub &rarr; Tower Apt</div>
          </div>
        </button>

        {/* 2. Pipe Burst / Sump Leak */}
        <button
          onClick={() => handleTrigger('water_pipe_leak')}
          className="p-3 border-2 border-black bg-white hover:bg-neutral-50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-black mb-1.5">
            <Droplets className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1 py-0.5 border border-black">BASEMENT</span>
          </div>
          <div>
            <div className="text-xs font-black text-black">Basement Water Leak</div>
            <div className="text-[10px] text-neutral-600 line-clamp-1">Hydro Sump Seepage</div>
          </div>
        </button>

        {/* 3. Courtyard Bin Overflow */}
        <button
          onClick={() => handleTrigger('smart_bin_overflow')}
          className="p-3 border-2 border-black bg-white hover:bg-neutral-50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-black mb-1.5">
            <Trash2 className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1 py-0.5 border border-black">PARK</span>
          </div>
          <div>
            <div className="text-xs font-black text-black">Bin Overflow 98%</div>
            <div className="text-[10px] text-neutral-600 line-clamp-1">Courtyard Sweeper Call</div>
          </div>
        </button>

        {/* 4. EV Charger Fault */}
        <button
          onClick={() => handleTrigger('ev_charger_fault')}
          className="p-3 border-2 border-black bg-white hover:bg-neutral-50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-black mb-1.5">
            <ZapOff className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1 py-0.5 border border-black">EV PLAZA</span>
          </div>
          <div>
            <div className="text-xs font-black text-black">EV Charger Fault</div>
            <div className="text-[10px] text-neutral-600 line-clamp-1">Inverter Isolation Trip</div>
          </div>
        </button>

        {/* 5. Fire Lane Obstruction */}
        <button
          onClick={() => handleTrigger('fire_lane_blocked')}
          className="p-3 border-2 border-black bg-white hover:bg-neutral-50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-black mb-1.5">
            <AlertTriangle className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1 py-0.5 border border-black">PERIMETER</span>
          </div>
          <div>
            <div className="text-xs font-black text-black">Block Fire Lane</div>
            <div className="text-[10px] text-neutral-600 line-clamp-1">Dispatch Security Patrol</div>
          </div>
        </button>

        {/* 6. Hardware Failure / P2P Failover Test */}
        <div className="p-2 border-2 border-black bg-neutral-50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-black mb-1">
            <span>P2P Failover</span>
            <span className="font-mono text-[9px] bg-black text-white px-1 py-0.5 rounded">DEMO</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleFailRandom}
              title="Kill an active robot to see live peer reallocation"
              className="flex-1 py-1.5 bg-black text-white text-[11px] font-bold border border-black hover:bg-neutral-800 transition-colors text-center"
            >
              Kill Unit
            </button>
            {failedBots.length > 0 && (
              <button
                onClick={handleRecoverAll}
                title="Recover all failed units"
                className="px-2 py-1.5 bg-white text-black text-[11px] font-bold border border-black hover:bg-neutral-100 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
