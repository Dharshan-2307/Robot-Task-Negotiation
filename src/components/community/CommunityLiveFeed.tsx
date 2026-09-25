'use client';

import React, { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { 
  Activity, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Radio
} from 'lucide-react';

export const CommunityLiveFeed: React.FC = () => {
  const { events } = useCommunityStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatTime = (ts: number) => {
    if (!isMounted) return '--:--:--';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return '--:--:--';
    }
  };

  return (
    <div className="bg-white border-2 border-black p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
          <h3 className="text-sm font-black text-black uppercase tracking-wider">
            Facility Event Log
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold bg-neutral-100 border border-black px-1.5 py-0.5">
          LIVE AUDIT
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 flex-1">
        {events.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            Awaiting community facility telemetry...
          </div>
        ) : (
          events.map(event => (
            <div 
              key={event.id}
              className="p-2.5 border border-neutral-300 hover:border-black transition-colors bg-white text-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1 font-mono">
                <span className="font-bold text-black uppercase tracking-wider">
                  [{event.type}]
                </span>
                <span suppressHydrationWarning>{formatTime(event.timestamp)}</span>
              </div>
              <p className="text-neutral-800 leading-snug font-medium">
                {event.message}
              </p>
              {event.robotId && (
                <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-neutral-600">
                  <span className="bg-neutral-100 px-1 py-0.5 border border-neutral-300 rounded font-bold">
                    BOT: {event.robotId}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
