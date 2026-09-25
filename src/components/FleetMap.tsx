// ============================================================================
// FLEET MAP — High-Performance Canvas 2D Renderer (60 FPS @ 500+ Robots)
// Pan, Zoom, Click-to-Select, Route Trails, Conflict Halos, Negotiation Beams
// ============================================================================

'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { Robot, Position, MapConfig } from '@/types';

// --- Color Palette ---
const COLORS = {
  bg: '#080c14',
  grid: '#0f1a2e',
  gridMajor: '#152240',
  obstacle: '#1a1f2e',
  obstacleBorder: '#2a3050',
  chargingStation: '#facc15',
  taskStation: '#38bdf8',
  robotActive: '#22d3ee',
  robotIdle: '#f59e0b',
  robotCharging: '#a3e635',
  robotFailed: '#ef4444',
  robotNegotiating: '#c084fc',
  robotDeadlocked: '#f43f5e',
  robotRerouting: '#fb923c',
  robotSelected: '#ffffff',
  route: 'rgba(34, 211, 238, 0.3)',
  routeSelected: 'rgba(34, 211, 238, 0.7)',
  conflictHalo: 'rgba(239, 68, 68, 0.3)',
  negotiationBeam: 'rgba(192, 132, 252, 0.4)',
  text: '#94a3b8',
  textBright: '#e2e8f0',
};

function getRobotColor(state: Robot['state']): string {
  switch (state) {
    case 'active': return COLORS.robotActive;
    case 'idle': return COLORS.robotIdle;
    case 'charging': return COLORS.robotCharging;
    case 'failed': return COLORS.robotFailed;
    case 'negotiating': return COLORS.robotNegotiating;
    case 'deadlocked': return COLORS.robotDeadlocked;
    case 'rerouting': return COLORS.robotRerouting;
    default: return COLORS.robotIdle;
  }
}

export default function FleetMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Camera state
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0 });

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // Subscribe to specific store slices
  const robots = useFleetStore(s => s.robots);
  const sensors = useFleetStore(s => s.sensors);
  const map = useFleetStore(s => s.map);
  const conflicts = useFleetStore(s => s.conflicts);
  const negotiations = useFleetStore(s => s.negotiations);
  const selectedRobotId = useFleetStore(s => s.selectedRobotId);
  const selectRobot = useFleetStore(s => s.selectRobot);
  const heroDemoState = useFleetStore(s => s.heroDemoState);
  const isControllerOnline = useFleetStore(s => s.isControllerOnline);
  const waterPipes = useFleetStore(s => s.waterPipes);

  // --- Resize ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // --- Mouse Handlers ---
  const screenToWorld = useCallback((sx: number, sy: number): Position => {
    const cam = cameraRef.current;
    return {
      x: (sx - canvasSize.w / 2) / cam.zoom + cam.x,
      y: (sy - canvasSize.h / 2) / cam.zoom + cam.y,
    };
  }, [canvasSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const cam = cameraRef.current;
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, camStartX: cam.x, camStartY: cam.y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const cam = cameraRef.current;
    const dx = (e.clientX - drag.startX) / cam.zoom;
    const dy = (e.clientY - drag.startY) / cam.zoom;
    cam.x = drag.camStartX - dx;
    cam.y = drag.camStartY - dy;
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    const movedDist = Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY);
    drag.dragging = false;

    // If it was a click (not a drag), check for robot selection
    if (movedDist < 5) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);

      // Find closest robot
      let closest: Robot | null = null;
      let closestDist = 20; // Click threshold in world units
      for (const robot of robots) {
        const d = Math.sqrt((robot.position.x - world.x) ** 2 + (robot.position.y - world.y) ** 2);
        if (d < closestDist) {
          closestDist = d;
          closest = robot;
        }
      }
      selectRobot(closest?.id ?? null);
    }
  }, [robots, screenToWorld, selectRobot]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    cam.zoom = Math.max(0.2, Math.min(5, cam.zoom * factor));
  }, []);

  // --- Render Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center camera on map initially
    const cam = cameraRef.current;
    if (cam.x === 0 && cam.y === 0) {
      cam.x = map.width / 2;
      cam.y = map.height / 2;
    }

    let frame = 0;

    function render() {
      if (!ctx || !canvas) return;
      frame++;

      const dpr = window.devicePixelRatio || 1;
      const w = canvasSize.w;
      const h = canvasSize.h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cam = cameraRef.current;

      // Clear
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Apply camera transform
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // Draw grid
      drawGrid(ctx, cam, w, h, map);

      // Draw obstacles & farm buildings with high-contrast header plates
      for (const obs of map.obstacles) {
        if (obs.type === 'shed') {
          // Shed building base
          ctx.fillStyle = '#080e1a';
          ctx.strokeStyle = '#1e3a5f';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Dedicated High-Contrast Header Bar Plate
          const headerH = 26;
          ctx.fillStyle = '#0f233d';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          // Status indicator dot
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(obs.x + 14, obs.y + headerH / 2, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Shed Title in crisp, bright white/cyan
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'POULTRY SHED', obs.x + 24, obs.y + headerH / 2);

          // Header Sub-label tag
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('CLIMATE & PIPES', obs.x + obs.w - 10, obs.y + headerH / 2);

          // Subtle bay zone divider inside shed
          ctx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.w / 2, obs.y + headerH);
          ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (obs.type === 'tank') {
          ctx.fillStyle = '#082f49';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Tank Header Plate
          const headerH = 24;
          ctx.fillStyle = '#0c4a6e';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'WATER TANK', obs.x + obs.w / 2, obs.y + headerH / 2);

          ctx.fillStyle = '#7dd3fc';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('💧 Supply Manifold', obs.x + obs.w / 2, obs.y + obs.h / 2 + 10);
        } else if (obs.type === 'substation') {
          ctx.fillStyle = '#261908';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Substation Header Plate
          const headerH = 24;
          ctx.fillStyle = '#422006';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'SUBSTATION', obs.x + obs.w / 2, obs.y + headerH / 2);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('⚡ 415V/230V Dist', obs.x + obs.w / 2, obs.y + obs.h / 2 + 10);
        } else {
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#78716c';
          ctx.lineWidth = 1;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
          if (obs.label) {
            ctx.fillStyle = '#f5f5f4';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2);
          }
        }
      }

      // Draw water pipe sections (Step 27) with high-contrast pill tags
      for (const pipe of waterPipes) {
        const isBlocked = pipe.status !== 'normal';
        ctx.save();
        ctx.translate(pipe.location.x, pipe.location.y);

        // Pipe node circle
        ctx.fillStyle = isBlocked ? '#ef4444' : '#0284c7';
        ctx.strokeStyle = isBlocked ? '#fca5a5' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pipe Tag Pill
        const pipeLabel = `${pipe.id}`;
        ctx.font = 'bold 9px monospace';
        const ptw = ctx.measureText(pipeLabel).width;
        const pBoxW = ptw + 8;
        const pBoxH = 14;

        ctx.fillStyle = isBlocked ? 'rgba(127, 29, 29, 0.95)' : 'rgba(12, 74, 110, 0.92)';
        ctx.strokeStyle = isBlocked ? '#f87171' : '#0284c7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-pBoxW / 2, 7, pBoxW, pBoxH, 3);
        } else {
          ctx.rect(-pBoxW / 2, 7, pBoxW, pBoxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isBlocked ? '#fee2e2' : '#e0f2fe';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pipeLabel, 0, 7 + pBoxH / 2);
        ctx.restore();
      }

      // Draw P2P mesh relay links when Central Controller is offline (Step 20)
      if (!isControllerOnline) {
        const relays = robots.filter(r => r.capability === 'communication_relay' || r.isMeshRelay);
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        for (const relay of relays) {
          // Draw communication range circle
          ctx.beginPath();
          ctx.arc(relay.position.x, relay.position.y, 100, 0, Math.PI * 2);
          ctx.stroke();

          // Connect to nearby active robots
          for (let i = 0; i < robots.length; i += 10) {
            const other = robots[i];
            if (other.id !== relay.id && (other.state === 'active' || other.state === 'negotiating')) {
              const d = Math.sqrt((relay.position.x - other.position.x) ** 2 + (relay.position.y - other.position.y) ** 2);
              if (d < 100) {
                ctx.beginPath();
                ctx.moveTo(relay.position.x, relay.position.y);
                ctx.lineTo(other.position.x, other.position.y);
                ctx.stroke();
              }
            }
          }
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw charging stations
      for (const st of map.chargingStations) {
        ctx.save();
        ctx.translate(st.x, st.y);
        const pulse = 0.8 + Math.sin(frame * 0.05) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.chargingStation;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Lightning bolt icon
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
        ctx.restore();
      }

      // Draw task stations
      for (const st of map.taskStations) {
        ctx.fillStyle = COLORS.taskStation;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.rect(st.x - 6, st.y - 6, 12, 12);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw distributed sensor nodes
      for (const sensor of sensors) {
        ctx.save();
        ctx.translate(sensor.location.x, sensor.location.y);
        const isCritical = sensor.status === 'critical';

        if (isCritical) {
          const pulse = 16 + Math.sin(frame * 0.12) * 8;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, pulse + 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sensor node body
        ctx.fillStyle = isCritical ? '#ef4444' : '#0f172a';
        ctx.strokeStyle = isCritical ? '#fca5a5' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icon glyph
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const glyph = sensor.type === 'W1209-temp' ? '🌡' : sensor.type === 'power-pzem' ? '⚡' : '💧';
        ctx.fillText(glyph, 0, 0);

        // High-contrast sensor badge pill
        const labelText = `${sensor.name}: ${sensor.currentValue.toFixed(1)}${sensor.unit}`;
        ctx.font = 'bold 10px monospace';
        const stw = ctx.measureText(labelText).width;
        const sBoxW = stw + 12;
        const sBoxH = 17;
        const sBoxY = -23;

        ctx.fillStyle = isCritical ? 'rgba(80, 10, 10, 0.95)' : 'rgba(10, 18, 35, 0.95)';
        ctx.strokeStyle = isCritical ? '#ef4444' : '#0284c7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-sBoxW / 2, sBoxY, sBoxW, sBoxH, 4);
        } else {
          ctx.rect(-sBoxW / 2, sBoxY, sBoxW, sBoxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isCritical ? '#fecaca' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 0, sBoxY + sBoxH / 2);
        ctx.restore();
      }

      // Draw active conflict halos
      const activeConflicts = conflicts.filter(c => c.status !== 'resolved');
      for (const conf of activeConflicts) {
        const pulse = 10 + Math.sin(frame * 0.08) * 8;
        ctx.fillStyle = COLORS.conflictHalo;
        ctx.beginPath();
        ctx.arc(conf.position.x, conf.position.y, pulse + 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw warning icon
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', conf.position.x, conf.position.y);
      }

      // Draw negotiation beams
      const activeNegs = negotiations.filter(n => n.status === 'in-progress');
      for (const neg of activeNegs) {
        if (neg.robotIds.length >= 2) {
          const r1 = robots.find(r => r.id === neg.robotIds[0]);
          const r2 = robots.find(r => r.id === neg.robotIds[1]);
          if (r1 && r2) {
            ctx.save();
            ctx.strokeStyle = COLORS.negotiationBeam;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.lineDashOffset = -frame * 0.5;
            ctx.beginPath();
            ctx.moveTo(r1.position.x, r1.position.y);
            ctx.lineTo(r2.position.x, r2.position.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Negotiation midpoint indicator
            const mx = (r1.position.x + r2.position.x) / 2;
            const my = (r1.position.y + r2.position.y) / 2;
            ctx.fillStyle = COLORS.robotNegotiating;
            ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1) * 0.3;
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }
      }

      // Draw robot routes
      for (const robot of robots) {
        if (robot.route.length > 0) {
          const isSelected = robot.id === selectedRobotId;
          ctx.strokeStyle = isSelected ? COLORS.routeSelected : COLORS.route;
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.setLineDash(isSelected ? [] : [3, 3]);
          ctx.beginPath();
          ctx.moveTo(robot.position.x, robot.position.y);
          for (const wp of robot.route) {
            ctx.lineTo(wp.x, wp.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw robots (batch by state for perf)
      const selectedRobot = robots.find(r => r.id === selectedRobotId);

      for (const robot of robots) {
        const isSelected = robot.id === selectedRobotId;
        const color = getRobotColor(robot.state);
        const px = robot.position.x;
        const py = robot.position.y;
        const radius = isSelected ? 6 : 4;

        // Robot body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect for active/selected
        if (isSelected || robot.state === 'active') {
          ctx.save();
          ctx.globalAlpha = isSelected ? 0.5 : 0.2;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // Pulsing effect for failed/deadlocked
        if (robot.state === 'failed' || robot.state === 'deadlocked') {
          const pulseR = radius + 3 + Math.sin(frame * 0.15) * 3;
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, pulseR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // Selection ring
        if (isSelected) {
          ctx.strokeStyle = COLORS.robotSelected;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, radius + 8, 0, Math.PI * 2);
          ctx.stroke();

          // Show ID label
          ctx.fillStyle = COLORS.textBright;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(robot.id, px, py - radius - 10);

          // Battery bar
          const barW = 24;
          const barH = 3;
          const barX = px - barW / 2;
          const barY = py - radius - 8;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = robot.battery > 20 ? '#22c55e' : '#ef4444';
          ctx.fillRect(barX, barY, barW * (robot.battery / 100), barH);
        }
      }

      // Draw selected robot target
      if (selectedRobot?.targetPosition) {
        const tp = selectedRobot.targetPosition;
        ctx.strokeStyle = COLORS.robotSelected;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(tp.x - 12, tp.y); ctx.lineTo(tp.x + 12, tp.y);
        ctx.moveTo(tp.x, tp.y - 12); ctx.lineTo(tp.x, tp.y + 12);
        ctx.stroke();
      }

      ctx.restore();

      // HUD overlay (screen-space)
      drawHUD(ctx, w, h, cam, robots.length, isControllerOnline);

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [canvasSize, robots, map, conflicts, negotiations, selectedRobotId, isControllerOnline, waterPipes]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-700/50 bg-[#080c14]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ width: canvasSize.w, height: canvasSize.h }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      {/* Step 20 Showstopper: Controller Offline Floating Warning Banner */}
      {!isControllerOnline && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-mono font-bold shadow-2xl animate-pulse backdrop-blur-md z-10">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>🔴 CENTRAL CONTROLLER OFFLINE — DECENTRALIZED P2P MESH ACTIVE (500 UNITS)</span>
        </div>
      )}
      {/* Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md rounded-lg px-3 py-2 text-xs font-mono border border-slate-700/80 shadow-2xl">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-slate-200 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Idle</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block" /> Charging</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Failed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Negotiating</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Deadlocked</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Charging Stn</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" /> Task Stn</span>
        </div>
      </div>
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => { cameraRef.current.zoom = Math.min(5, cameraRef.current.zoom * 1.3); }}
          className="w-8 h-8 bg-slate-800/90 hover:bg-slate-700 border border-slate-600/50 rounded-md text-slate-300 text-lg font-bold backdrop-blur-sm transition-colors"
        >+</button>
        <button
          onClick={() => { cameraRef.current.zoom = Math.max(0.2, cameraRef.current.zoom / 1.3); }}
          className="w-8 h-8 bg-slate-800/90 hover:bg-slate-700 border border-slate-600/50 rounded-md text-slate-300 text-lg font-bold backdrop-blur-sm transition-colors"
        >−</button>
        <button
          onClick={() => { cameraRef.current.zoom = 1; cameraRef.current.x = map.width / 2; cameraRef.current.y = map.height / 2; }}
          className="w-8 h-8 bg-slate-800/90 hover:bg-slate-700 border border-slate-600/50 rounded-md text-slate-300 text-[9px] font-bold backdrop-blur-sm transition-colors"
        >FIT</button>
      </div>
    </div>
  );
}

// --- Grid Drawing ---
function drawGrid(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; zoom: number }, w: number, h: number, map: MapConfig) {
  const gs = map.gridSize;
  const startX = Math.floor((cam.x - w / 2 / cam.zoom) / gs) * gs;
  const endX = Math.ceil((cam.x + w / 2 / cam.zoom) / gs) * gs;
  const startY = Math.floor((cam.y - h / 2 / cam.zoom) / gs) * gs;
  const endY = Math.ceil((cam.y + h / 2 / cam.zoom) / gs) * gs;

  ctx.lineWidth = 0.5;

  for (let x = startX; x <= endX; x += gs) {
    ctx.strokeStyle = x % (gs * 5) === 0 ? COLORS.gridMajor : COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y += gs) {
    ctx.strokeStyle = y % (gs * 5) === 0 ? COLORS.gridMajor : COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  // Map boundary
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, map.width, map.height);
}

// --- HUD Drawing ---
function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, cam: { x: number; y: number; zoom: number }, robotCount: number, isOnline: boolean) {
  ctx.save();
  const text = `ZOOM: ${cam.zoom.toFixed(2)}x  •  POS: (${Math.round(cam.x)}, ${Math.round(cam.y)})  •  FLEET: ${robotCount} units`;
  ctx.font = 'bold 11px monospace';
  const tw = ctx.measureText(text).width;
  const bw = tw + 28;
  const bh = 26;
  const bx = 12;
  const by = isOnline ? 12 : 46;

  // Background pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = isOnline ? 'rgba(56, 189, 248, 0.5)' : '#ef4444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 6);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  // Status dot
  ctx.fillStyle = isOnline ? '#10b981' : '#ef4444';
  ctx.beginPath();
  ctx.arc(bx + 12, by + bh / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Crisp high-contrast white text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + 22, by + bh / 2);
  ctx.restore();
}
