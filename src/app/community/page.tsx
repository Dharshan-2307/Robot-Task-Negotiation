'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Layers, 
  Map as MapIcon, 
  ListOrdered, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { CommunityStatusCards } from '@/components/community/CommunityStatusCards';
import { CommunityMap } from '@/components/community/CommunityMap';
import { CommunityIssuePanel } from '@/components/community/CommunityIssuePanel';
import { CommunityTaskTable } from '@/components/community/CommunityTaskTable';
import { CommunityLiveFeed } from '@/components/community/CommunityLiveFeed';
import { CommunityRobotDetails } from '@/components/community/CommunityRobotDetails';
import { useCommunityStore } from '@/store/useCommunityStore';

export default function CommunityPage() {
  const { activeView, setActiveView } = useCommunityStore();
  const [showSidePanel, setShowSidePanel] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-16 selection:bg-black selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-lg border-2 border-black">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wider uppercase text-black">URBANCOMMUNITY</span>
                <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded">
                  ISOLATED ENGINE
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Gated Apartment Complex &bull; Autonomous Multi-Robot Facility Swarm
              </p>
            </div>
          </div>

          {/* Central Environment Switcher Pill */}
          <div className="flex items-center border-2 border-black p-1 bg-neutral-100">
            <Link
              href="/"
              className="px-3 py-1 text-xs font-bold text-neutral-600 hover:text-black hover:bg-white transition-all flex items-center gap-1.5"
            >
              <span>🐔</span>
              <span>Poultry Farm</span>
            </Link>
            <div className="px-3 py-1 text-xs font-bold bg-black text-white flex items-center gap-1.5 shadow-sm">
              <span>🏢</span>
              <span>Gated Community</span>
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 border border-neutral-300 px-2.5 py-1 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-neutral-800">4 TOWERS ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Banner with Isolation Notice */}
        <div className="bg-neutral-50 border-2 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-black tracking-tight">
              High-Rise Residential & Facility Multi-Robot Automation
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5 max-w-3xl">
              Completely independent facility operating system. Manages parcel runners (Towers A-D), automated basement leak mitigators, courtyard sanitizers, EV superchargers, and fire corridor surveillance with decentralized peer-to-peer negotiation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-700">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>Zero State Collision with AgriSwarm</span>
          </div>
        </div>

        {/* Status KPI Cards */}
        <CommunityStatusCards />

        {/* Incident Trigger Simulator Deck */}
        <CommunityIssuePanel />

        {/* Map & Live Telemetry Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* 2D Canvas Map of Complex */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <MapIcon className="w-3.5 h-3.5 text-black" />
                Apartment Complex Aerial Digital Twin
              </h3>
              <span className="text-[11px] text-neutral-500 font-mono">
                1200x800m Precinct Grid
              </span>
            </div>
            <CommunityMap />
          </div>

          {/* Unit / Building Telemetry Side Panel */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-black" />
                Inspector & Feed
              </h3>
            </div>
            <div className="h-[620px]">
              <CommunityRobotDetails />
            </div>
          </div>
        </div>

        {/* Secondary Lower Grid: Tickets Table & Live Event Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CommunityTaskTable />
          </div>
          <div className="lg:col-span-1">
            <CommunityLiveFeed />
          </div>
        </div>
      </main>
    </div>
  );
}
