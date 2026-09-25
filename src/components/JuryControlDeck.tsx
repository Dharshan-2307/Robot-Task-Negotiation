'use client';

// ============================================================================
// AGRISWARM JURY CONTROL DECK — Step 24 Live Demonstration Interactive Triggers
// Provides judges/examiners instant fault injection and Central Controller failover testing
// ============================================================================

import React from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import {
  WifiOff,
  Wifi,
  Droplets,
  Zap,
  BotOff,
  Radio,
  BatteryWarning,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const JuryControlDeck: React.FC = () => {
  const isControllerOnline = useFleetStore(s => s.isControllerOnline);
  const toggleControllerOnline = useFleetStore(s => s.toggleControllerOnline);
  const createWaterFault = useFleetStore(s => s.createWaterFault);
  const createElectricalFault = useFleetStore(s => s.createElectricalFault);
  const failRandomRobot = useFleetStore(s => s.failRandomRobot);
  const triggerCommLossZone = useFleetStore(s => s.triggerCommLossZone);
  const triggerLowBatteryEvent = useFleetStore(s => s.triggerLowBatteryEvent);
  const runHeroDemo = useFleetStore(s => s.runHeroDemo);
  const heroDemoState = useFleetStore(s => s.heroDemoState);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Badge: Jury & Examiner Testing Deck */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Jury Testing Deck
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Direct fault injection & failover controls
          </span>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Step 20 Showstopper: Controller Offline / Online Toggle */}
          <button
            id="btn-toggle-controller"
            onClick={toggleControllerOnline}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-md active:scale-95 ${
              isControllerOnline
                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 shadow-emerald-900/20'
                : 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500 animate-pulse shadow-rose-900/40'
            }`}
            title="Step 20 Showstopper: Simulates total central controller loss. Robots switch to P2P mesh autonomy."
          >
            {isControllerOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>CONTROLLER: ONLINE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-extrabold text-rose-300">CONTROLLER: OFFLINE (MESH P2P)</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </>
            )}
          </button>

          {/* Trigger 1: Water Fault */}
          <button
            id="btn-jury-water-fault"
            onClick={createWaterFault}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 font-mono text-xs transition active:scale-95 hover:border-cyan-400"
            title="Inject low-pressure blockage in Shed 2 nipple water line"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Water Fault</span>
          </button>

          {/* Trigger 2: Electrical Fault */}
          <button
            id="btn-jury-power-fault"
            onClick={createElectricalFault}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-950/60 hover:bg-yellow-900/80 text-yellow-300 border border-yellow-500/30 font-mono text-xs transition active:scale-95 hover:border-yellow-400"
            title="Trigger PZEM-004T under-voltage event at Substation 1"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Power Fault</span>
          </button>

          {/* Trigger 3: Fail Random Robot */}
          <button
            id="btn-jury-fail-robot"
            onClick={failRandomRobot}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 font-mono text-xs transition active:scale-95 hover:border-rose-400"
            title="Break an active robot to observe immediate dynamic task reassignment"
          >
            <BotOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Fail Robot</span>
          </button>

          {/* Trigger 4: Comm Blackout */}
          <button
            id="btn-jury-comm-loss"
            onClick={() => triggerCommLossZone('Poultry Shed 3')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 font-mono text-xs transition active:scale-95 hover:border-purple-400"
            title="Simulate RF noise / communication blackout in Shed 3"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Comm Loss</span>
          </button>

          {/* Trigger 5: Low Battery */}
          <button
            id="btn-jury-low-battery"
            onClick={triggerLowBatteryEvent}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 border border-orange-500/30 font-mono text-xs transition active:scale-95 hover:border-orange-400"
            title="Drop robot battery to 12% to trigger automatic return-to-base negotiation"
          >
            <BatteryWarning className="w-3.5 h-3.5 text-orange-400" />
            <span>Low Batt</span>
          </button>

          {/* Trigger 6: Hero Storyline Presentation Demo */}
          <button
            id="btn-jury-hero-demo"
            onClick={runHeroDemo}
            disabled={heroDemoState?.isActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition active:scale-95 shadow-md ${
              heroDemoState?.isActive
                ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/50 shadow-indigo-900/30'
            }`}
            title="Step 29: Run full 7-step presentation storyline (The robot failed. The mission didn't.)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{heroDemoState?.isActive ? 'Demo Running...' : 'Hero Storyline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
