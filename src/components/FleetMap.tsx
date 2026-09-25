// ============================================================================
// FLEET MAP — High-Performance Canvas 2D Renderer (60 FPS @ 500+ Robots)
// Pan, Zoom, Click-to-Select, Route Trails, Conflict Halos, Negotiation Beams
// ============================================================================

'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { Robot, Position, MapConfig } from '@/types';

// --- Color Palette (Clean Black & White / Light Architecture) ---
const COLORS = {
  bg: '#ffffff',
  grid: '#f1f5f9',
  gridMajor: '#e2e8f0',
  obstacle: '#f8fafc',
  obstacleBorder: '#0f172a',
  chargingStation: '#eab308',
  taskStation: '#0284c7',
  robotActive: '#0f172a',
  robotIdle: '#64748b',
  robotCharging: '#16a34a',
  robotFailed: '#dc2626',
  robotNegotiating: '#7c3aed',
  robotDeadlocked: '#e11d48',
  robotRerouting: '#ea580c',
  robotSelected: '#000000',
  route: 'rgba(15, 23, 42, 0.15)',
  routeSelected: 'rgba(15, 23, 42, 0.65)',
  conflictHalo: 'rgba(220, 38, 38, 0.25)',
  negotiationBeam: 'rgba(124, 58, 237, 0.3)',
  text: '#475569',
  textBright: '#0f172a',
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

  // --- Native Non-Passive Wheel Listener (Focal Zoom on Map Only — Stops Entire Site From Zooming) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Forcibly prevent the browser from zooming the webpage or scrolling
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const cam = cameraRef.current;
      const oldZoom = cam.zoom;

      // Smooth zoom multiplier based on scroll wheel
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const newZoom = Math.max(0.15, Math.min(8, oldZoom * factor));

      // Focal Zoom: Pin the exact world point under the cursor so only that part zooms
      const w = canvasSize.w;
      const h = canvasSize.h;
      const wx = (sx - w / 2) / oldZoom + cam.x;
      const wy = (sy - h / 2) / oldZoom + cam.y;

      cam.x = wx - (sx - w / 2) / newZoom;
      cam.y = wy - (sy - h / 2) / newZoom;
      cam.zoom = newZoom;
    };

    // passive: false is REQUIRED so e.preventDefault() blocks browser-level site zoom
    canvas.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [canvasSize]);

  // --- Pointer Handlers (Rock-Solid Pan and Navigation) ---
  const screenToWorld = useCallback((sx: number, sy: number): Position => {
    const cam = cameraRef.current;
    return {
      x: (sx - canvasSize.w / 2) / cam.zoom + cam.x,
      y: (sy - canvasSize.h / 2) / cam.zoom + cam.y,
    };
  }, [canvasSize]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only primary button
    const cam = cameraRef.current;
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      camStartX: cam.x,
      camStartY: cam.y
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const cam = cameraRef.current;
    const dx = (e.clientX - drag.startX) / cam.zoom;
    const dy = (e.clientY - drag.startY) / cam.zoom;
    cam.x = drag.camStartX - dx;
    cam.y = drag.camStartY - dy;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const movedDist = Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY);
    drag.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

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

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
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
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Dedicated High-Contrast Header Bar Plate
          const headerH = 26;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          // Status indicator dot
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(obs.x + 14, obs.y + headerH / 2, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Shed Title in crisp white on black plate
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'POULTRY SHED', obs.x + 24, obs.y + headerH / 2);

          // Header Sub-label tag
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('CLIMATE & PIPES', obs.x + obs.w - 10, obs.y + headerH / 2);

          // Subtle bay zone divider inside shed
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.w / 2, obs.y + headerH);
          ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (obs.type === 'tank') {
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Tank Header Plate
          const headerH = 24;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'WATER TANK', obs.x + obs.w / 2, obs.y + headerH / 2);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('💧 Supply Manifold', obs.x + obs.w / 2, obs.y + obs.h / 2 + 10);
        } else if (obs.type === 'substation') {
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Substation Header Plate
          const headerH = 24;
          ctx.fillStyle = '#334155';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'SUBSTATION', obs.x + obs.w / 2, obs.y + headerH / 2);

        } else if (obs.type === 'pump') {
          // Pump Station building base
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Dedicated High-Contrast Header Bar Plate
          const headerH = 26;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x, obs.y, obs.w, headerH);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.w, headerH);

          // Status indicator dot
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(obs.x + 14, obs.y + headerH / 2, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Pump Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label || 'WATER PUMP STATION', obs.x + 24, obs.y + headerH / 2);

          // Header Sub-label tag
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('PUMPS & PRESSURE', obs.x + obs.w - 10, obs.y + headerH / 2);

          // Center Glyph
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚙️ HIGH-PRESSURE PUMP MANIFOLD', obs.x + obs.w / 2, obs.y + obs.h / 2 + 10);
        } else {
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
          if (obs.label) {
            ctx.fillStyle = '#0f172a';
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
          const stepSize = Math.max(1, Math.floor(robots.length / 50));
          for (let i = 0; i < robots.length; i += stepSize) {
            const other = robots[i];
            if (other.id !== relay.id && (other.state === 'active' || other.state === 'negotiating' || other.state === 'idle')) {
              const d = Math.sqrt((relay.position.x - other.position.x) ** 2 + (relay.position.y - other.position.y) ** 2);
              if (d < 180) {
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

        ctx.fillStyle = isCritical ? 'rgba(254, 242, 242, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = isCritical ? '#ef4444' : '#0f172a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-sBoxW / 2, sBoxY, sBoxW, sBoxH, 4);
        } else {
          ctx.rect(-sBoxW / 2, sBoxY, sBoxW, sBoxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isCritical ? '#991b1b' : '#0f172a';
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

      // Draw robots (dynamically optimized for small fleets like 5 bots up to 500 bots)
      const selectedRobot = robots.find(r => r.id === selectedRobotId);
      const isSmallFleet = robots.length <= 25;

      for (const robot of robots) {
        const isSelected = robot.id === selectedRobotId;
        const color = getRobotColor(robot.state);
        const px = robot.position.x;
        const py = robot.position.y;
        const baseRadius = isSmallFleet ? 9 : 4;
        const radius = isSelected ? baseRadius + 3 : baseRadius;

        // Robot body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // High contrast border for small fleets so they pop out
        if (isSmallFleet) {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Glow effect
        if (isSelected || robot.state === 'active' || isSmallFleet) {
          ctx.save();
          ctx.globalAlpha = isSelected ? 0.35 : (isSmallFleet ? 0.2 : 0.12);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, radius + (isSmallFleet ? 6 : 4), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // Pulsing effect for failed/deadlocked
        if (robot.state === 'failed' || robot.state === 'deadlocked') {
          const pulseR = radius + 4 + Math.sin(frame * 0.15) * 4;
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, pulseR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // Always show ID tag & battery bar if small fleet (e.g. 5 robots) OR if selected!
        if (isSelected || isSmallFleet) {
          if (isSelected) {
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, radius + 8, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Show ID label with high-contrast white badge background
          const label = robot.id;
          ctx.font = isSmallFleet ? 'bold 11px monospace' : 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const ltw = ctx.measureText(label).width;
          const bgH = isSmallFleet ? 15 : 13;
          const bgY = py - radius - (isSmallFleet ? 13 : 10);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(px - ltw / 2 - 4, bgY - bgH / 2, ltw + 8, bgH);
          ctx.strokeStyle = isSelected ? '#000000' : (robot.state === 'active' ? '#0f172a' : '#94a3b8');
          ctx.lineWidth = isSelected ? 1.5 : 1;
          ctx.strokeRect(px - ltw / 2 - 4, bgY - bgH / 2, ltw + 8, bgH);

          ctx.fillStyle = '#0f172a';
          ctx.fillText(label, px, bgY);

          // Battery bar
          const barW = isSmallFleet ? 28 : 24;
          const barH = isSmallFleet ? 4 : 3;
          const barX = px - barW / 2;
          const barY = py + radius + 4;
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = robot.battery > 50 ? '#16a34a' : (robot.battery > 20 ? '#d97706' : '#dc2626');
          const clampedBattery = Math.max(0, Math.min(100, robot.battery));
          ctx.fillRect(barX, barY, barW * (clampedBattery / 100), barH);
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
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-white select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ width: canvasSize.w, height: canvasSize.h }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />

      {/* Step 20 Showstopper: Controller Offline Floating Warning Banner */}
      {!isControllerOnline && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-500 text-red-700 text-xs font-mono font-bold shadow-md animate-pulse backdrop-blur-md z-10">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span>🔴 CENTRAL CONTROLLER OFFLINE — DECENTRALIZED P2P MESH ACTIVE (500 UNITS)</span>
        </div>
      )}

      {/* Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-lg px-3 py-2 text-xs font-mono border border-slate-300 shadow-md z-10 text-slate-800">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block shadow-xs" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Idle</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Charging</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Failed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Negotiating</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Deadlocked</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 inline-block" /> Charging Stn</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" /> Task Stn</span>
        </div>
      </div>

      {/* Zoom Controls (Docked cleanly at bottom-right, well clear of top actions) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-300 shadow-md z-10">
        <button
          onClick={() => { cameraRef.current.zoom = Math.min(5, cameraRef.current.zoom * 1.3); }}
          title="Zoom In"
          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-900 text-sm font-bold transition-colors"
        >+</button>
        <button
          onClick={() => { cameraRef.current.zoom = Math.max(0.2, cameraRef.current.zoom / 1.3); }}
          title="Zoom Out"
          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-900 text-sm font-bold transition-colors"
        >−</button>
        <button
          onClick={() => { cameraRef.current.zoom = 1; cameraRef.current.x = map.width / 2; cameraRef.current.y = map.height / 2; }}
          title="Reset Camera & Fit Map"
          className="px-2 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-black text-[10px] font-mono font-bold transition-colors"
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
  ctx.strokeStyle = '#0f172a';
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = isOnline ? '#0f172a' : '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 6);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  // Status dot
  ctx.fillStyle = isOnline ? '#16a34a' : '#dc2626';
  ctx.beginPath();
  ctx.arc(bx + 12, by + bh / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Crisp high-contrast black text
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + 22, by + bh / 2);
  ctx.restore();
}
