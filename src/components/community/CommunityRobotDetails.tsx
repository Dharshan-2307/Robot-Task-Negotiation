'use client';

import React from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { 
  Bot, 
  Battery, 
  Heart, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Building,
  RefreshCw,
  Power
} from 'lucide-react';

export const CommunityRobotDetails: React.FC = () => {
  const { 
    robots, 
    buildings, 
    selectedRobotId, 
    selectedBuildingId, 
    selectRobot, 
    selectBuilding,
    failCommunityRobot,
    recoverCommunityRobot
  } = useCommunityStore();

  const selectedRobot = robots.find(r => r.id === selectedRobotId);
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  if (!selectedRobot && !selectedBuilding) {
    return (
      <div className="bg-white border-2 border-black p-4 shadow-sm h-full flex flex-col justify-center items-center text-center">
        <Bot className="w-8 h-8 text-neutral-400 mb-2" />
        <h4 className="text-xs font-bold text-black uppercase tracking-wider">Unit & Zone Telemetry</h4>
        <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
          Click any service robot or building structure on the complex map to view real-time metrics.
        </p>
      </div>
    );
  }

  if (selectedRobot) {
    const isFailed = selectedRobot.state === 'failed';

    return (
      <div className="bg-white border-2 border-black p-4 shadow-sm h-full flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-2 border-b-2 border-black mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black" />
                <h4 className="text-sm font-black text-black font-mono">{selectedRobot.name}</h4>
              </div>
              <p className="text-[11px] text-neutral-600 font-semibold capitalize mt-0.5">
                {selectedRobot.role.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={() => selectRobot(null)}
              className="p-1 hover:bg-neutral-100 rounded text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 border border-neutral-300 bg-neutral-50">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>BATTERY</span>
                <Battery className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-base font-black text-black font-mono">
                {Math.round(selectedRobot.battery)}%
              </div>
            </div>

            <div className="p-2 border border-neutral-300 bg-neutral-50">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>HEALTH</span>
                <Heart className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-base font-black text-black font-mono">
                {selectedRobot.health}%
              </div>
            </div>
          </div>

          {/* Status & Position details */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500">Operational State:</span>
              <span className={`font-mono font-bold uppercase ${isFailed ? 'text-red-600' : 'text-black'}`}>
                {selectedRobot.state}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500">Zone Assignment:</span>
              <span className="font-semibold text-neutral-800">{selectedRobot.assignedZone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500">Current Coords:</span>
              <span className="font-mono text-neutral-800 font-bold">
                X:{Math.round(selectedRobot.position.x)}, Y:{Math.round(selectedRobot.position.y)}
              </span>
            </div>
            {selectedRobot.targetPosition && (
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Navigation ETA:</span>
                <span className="font-mono text-black font-bold">{selectedRobot.eta || 1}s remaining</span>
              </div>
            )}
            {selectedRobot.currentTicketId && (
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Active Ticket:</span>
                <span className="font-mono text-black font-bold">{selectedRobot.currentTicketId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-3 border-t border-neutral-300 mt-4">
          {isFailed ? (
            <button
              onClick={() => recoverCommunityRobot(selectedRobot.id)}
              className="w-full py-2 bg-black text-white text-xs font-bold border border-black hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-commission Unit
            </button>
          ) : (
            <button
              onClick={() => failCommunityRobot(selectedRobot.id)}
              className="w-full py-2 bg-white text-black text-xs font-bold border-2 border-black hover:bg-neutral-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Power className="w-3.5 h-3.5 text-black" />
              Simulate Failure (P2P Handover)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (selectedBuilding) {
    return (
      <div className="bg-white border-2 border-black p-4 shadow-sm h-full flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between pb-2 border-b-2 border-black mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-black" />
                <h4 className="text-sm font-black text-black">{selectedBuilding.label}</h4>
              </div>
              <p className="text-[11px] text-neutral-600 capitalize mt-0.5">
                Type: {selectedBuilding.type.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={() => selectBuilding(null)}
              className="p-1 hover:bg-neutral-100 rounded text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 border border-neutral-200 bg-neutral-50 rounded">
              <span className="text-[10px] text-neutral-500 font-bold block mb-1">FACILITY SPECIFICATIONS</span>
              <p className="text-neutral-800 font-medium">{selectedBuilding.details}</p>
            </div>

            {selectedBuilding.floors && (
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Building Height:</span>
                <span className="font-bold text-black">{selectedBuilding.floors} Floors</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500">Autonomous Elevator Port:</span>
              <span className="font-bold text-black font-mono">ONLINE</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500">Fire Hydrant Status:</span>
              <span className="font-bold text-black">PRESSURIZED (8.2 BAR)</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-300">
          <button
            onClick={() => selectBuilding(null)}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold border border-black transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    );
  }

  return null;
};
