'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Maximize2,
  Navigation,
  Info
} from 'lucide-react';
import { CommunityRobot, CommunityBuilding } from '@/types/community';

export const CommunityMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { 
    robots, 
    buildings, 
    issues, 
    selectedRobotId, 
    selectedBuildingId,
    selectRobot, 
    selectBuilding 
  } = useCommunityStore();

  // Transform state: Pan and Zoom
  const [scale, setScale] = useState<number>(0.9);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 30, y: 20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredRobot, setHoveredRobot] = useState<CommunityRobot | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<CommunityBuilding | null>(null);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);

  // Wheel zoom handler with focal-point preservation (non-passive to prevent full page scroll)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      
      setScale(prevScale => {
        const newScale = Math.min(Math.max(0.4, prevScale * zoomFactor), 3.0);
        const scaleChange = newScale / prevScale;
        
        setOffset(prevOffset => ({
          x: mouseX - (mouseX - prevOffset.x) * scaleChange,
          y: mouseY - (mouseY - prevOffset.y) * scaleChange,
        }));
        
        return newScale;
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Canvas Mouse Interaction for Panning and Clicking
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // World coordinate calculation
    const worldX = (mouseX - offset.x) / scale;
    const worldY = (mouseY - offset.y) / scale;

    // Check robot hover
    const foundRobot = robots.find(r => {
      const dx = r.position.x - worldX;
      const dy = r.position.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= 18;
    });

    if (foundRobot) {
      setHoveredRobot(foundRobot);
      setHoveredBuilding(null);
      return;
    } else {
      setHoveredRobot(null);
    }

    // Check building hover
    const foundBuilding = buildings.find(b => {
      return (
        worldX >= b.x &&
        worldX <= b.x + b.w &&
        worldY >= b.y &&
        worldY <= b.y + b.h
      );
    });

    setHoveredBuilding(foundBuilding || null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
    }

    // Only count as click if we didn't drag much
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - offset.x) / scale;
    const worldY = (mouseY - offset.y) / scale;

    // Check if robot clicked
    const clickedRobot = robots.find(r => {
      const dx = r.position.x - worldX;
      const dy = r.position.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });

    if (clickedRobot) {
      selectRobot(clickedRobot.id === selectedRobotId ? null : clickedRobot.id);
      selectBuilding(null);
      return;
    }

    // Check if building clicked
    const clickedBuilding = buildings.find(b => {
      return (
        worldX >= b.x &&
        worldX <= b.x + b.w &&
        worldY >= b.y &&
        worldY <= b.y + b.h
      );
    });

    if (clickedBuilding) {
      selectBuilding(clickedBuilding.id === selectedBuildingId ? null : clickedBuilding.id);
      selectRobot(null);
    } else {
      selectBuilding(null);
      selectRobot(null);
    }
  };

  // Reset View to default
  const handleResetView = () => {
    setScale(0.9);
    setOffset({ x: 30, y: 20 });
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply pan & zoom
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // 1. Draw Complex Outer Boundary & Perimeter Walkways
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1220, 780);

      // Outer boundary fence
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, 1140, 700);

      // Grid Lines / Architectural Tiles (Subtle)
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 40; x <= 1180; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, 740);
        ctx.stroke();
      }
      for (let y = 40; y <= 740; y += 40) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(1180, y);
        ctx.stroke();
      }

      // Internal Internal Transit Roads & Pavement
      ctx.fillStyle = '#f8fafc';
      // Main central avenue
      ctx.fillRect(40, 260, 1140, 40);
      ctx.fillRect(40, 500, 1140, 30);
      // North-south corridors
      ctx.fillRect(300, 40, 30, 700);
      ctx.fillRect(580, 40, 30, 700);
      ctx.fillRect(890, 40, 30, 700);

      // Draw road markings (center dashed lines)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(40, 280);
      ctx.lineTo(1180, 280);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(315, 40);
      ctx.lineTo(315, 740);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(600, 40);
      ctx.lineTo(600, 740);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Buildings
      buildings.forEach(b => {
        const isSelected = selectedBuildingId === b.id;
        const isHovered = hoveredBuilding?.id === b.id;

        // Background
        ctx.fillStyle = isSelected ? '#f8fafc' : isHovered ? '#fafafa' : '#ffffff';
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Border - Bold Black
        ctx.strokeStyle = isSelected ? '#000000' : '#1e293b';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Header band for Building
        ctx.fillStyle = isSelected ? '#000000' : '#0f172a';
        ctx.fillRect(b.x, b.y, b.w, 24);

        // Building Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x + 8, b.y + 12);

        // Building Details / Floor count
        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.fillText(b.details, b.x + 8, b.y + 42);

        // Floor indicators or special building patterns
        if (b.type === 'tower') {
          // Draw lift shaft / lobby icon
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(b.x + b.w - 55, b.y + 35, 45, 40);
          ctx.fillStyle = '#64748b';
          ctx.font = '9px sans-serif';
          ctx.fillText('🛗 LIFT', b.x + b.w - 50, b.y + 55);

          // Floor grid representation
          ctx.strokeStyle = '#e2e8f0';
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
              ctx.strokeRect(b.x + 12 + col * 26, b.y + 60 + row * 26, 20, 20);
            }
          }
        } else if (b.type === 'parking_ev') {
          // Draw EV Charger Bays
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(b.x + 10 + i * 36, b.y + 65, 30, 50);
            ctx.strokeStyle = '#64748b';
            ctx.strokeRect(b.x + 10 + i * 36, b.y + 65, 30, 50);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(`⚡P${i+1}`, b.x + 14 + i * 36, b.y + 90);
          }
        } else if (b.type === 'central_park') {
          // Courtyard greenery aesthetic
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(b.x + 4, b.y + 26, b.w - 8, b.h - 30);
          ctx.strokeStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(b.x + b.w / 2, b.y + b.h / 2 + 10, 45, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#334155';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌳 FOUNTAIN & CENTRAL LAWN 🌿', b.x + b.w / 2, b.y + b.h / 2 + 12);
        } else if (b.type === 'security_gate') {
          // Gate Hub
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(b.x + 15, b.y + 60, b.w - 30, 50);
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(b.x + 15, b.y + 60, b.w - 30, 50);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('📦 COURIER LOCKER VAULT', b.x + b.w / 2, b.y + 85);
        }
      });

      // 3. Draw Active Issues & Ticket Pins
      issues.forEach(issue => {
        if (issue.status === 'resolved') return;

        const { x, y } = issue.location;
        // Pulse ring
        const time = Date.now() / 300;
        const pulse = (Math.sin(time) + 1) * 4;

        ctx.strokeStyle = issue.severity === 'critical' ? '#000000' : '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 14 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', x, y);

        // Issue callout box
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 50, y - 28, 100, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(issue.title.slice(0, 16), x, y - 20);
      });

      // 4. Draw Active Robot Routes
      if (showRoutes) {
        robots.forEach(robot => {
          if (robot.targetPosition && robot.state !== 'idle' && robot.state !== 'failed') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(robot.position.x, robot.position.y);
            ctx.lineTo(robot.targetPosition.x, robot.targetPosition.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Target marker
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(robot.targetPosition.x, robot.targetPosition.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 5. Draw Autonomous Robots
      robots.forEach(robot => {
        const isSelected = selectedRobotId === robot.id;
        const isHovered = hoveredRobot?.id === robot.id;
        const isFailed = robot.state === 'failed';
        const { x, y } = robot.position;

        // Selection or Hover aura
        if (isSelected || isHovered) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Robot Body (Bold Black Disc)
        ctx.fillStyle = isFailed ? '#991b1b' : '#000000';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Robot Icon / Glyph inside
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let glyph = '🤖';
        if (robot.role === 'parcel_delivery') glyph = '📦';
        if (robot.role === 'sanitation_sweeper') glyph = '🧹';
        if (robot.role === 'security_patrol') glyph = '🛡️';
        if (robot.role === 'plumbing_maintenance') glyph = '🔧';
        if (robot.role === 'electrical_repair') glyph = '⚡';
        ctx.fillText(glyph, x, y);

        // Robot ID Badge above
        ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
        const badgeWidth = 56;
        ctx.fillRect(x - badgeWidth / 2, y - 28, badgeWidth, 13);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - badgeWidth / 2, y - 28, badgeWidth, 13);

        ctx.fillStyle = isSelected ? '#ffffff' : '#000000';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(robot.name, x, y - 22);

        // Battery bar below
        const barWidth = 24;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x - barWidth / 2, y + 16, barWidth, 4);
        ctx.fillStyle = robot.battery > 30 ? '#000000' : '#ef4444';
        ctx.fillRect(x - barWidth / 2, y + 16, (barWidth * robot.battery) / 100, 4);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - barWidth / 2, y + 16, barWidth, 4);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    robots,
    buildings,
    issues,
    selectedRobotId,
    selectedBuildingId,
    hoveredRobot,
    hoveredBuilding,
    scale,
    offset,
    showRoutes,
  ]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[620px] bg-white border-2 border-black overflow-hidden shadow-sm"
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1240}
        height={760}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Map Control Toolbar Top-Right */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white border-2 border-black p-1.5 shadow-md">
        <button
          onClick={() => setScale(s => Math.min(2.5, s * 1.15))}
          title="Zoom In (or use mousewheel on map)"
          className="p-1.5 hover:bg-neutral-100 rounded text-black font-bold transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.4, s * 0.85))}
          title="Zoom Out"
          className="p-1.5 hover:bg-neutral-100 rounded text-black font-bold transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset View"
          className="p-1.5 hover:bg-neutral-100 rounded text-black font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-neutral-300 mx-0.5" />
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          title="Toggle Navigation Lines"
          className={`p-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
            showRoutes ? 'bg-black text-white' : 'hover:bg-neutral-100 text-black'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="text-[10px]">Routes</span>
        </button>
      </div>

      {/* Legend Bottom-Left */}
      <div className="absolute bottom-3 left-3 bg-white border-2 border-black p-2.5 shadow-md text-[11px] flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-black inline-block" />
          <span className="font-semibold text-neutral-800">Autonomous Bot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
          <span className="font-semibold text-neutral-800">Fault / Diagnostic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-neutral-500 font-bold">---</span>
          <span className="font-semibold text-neutral-800">P2P Route</span>
        </div>
        <div className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-500 text-[10px]">Click any robot or building to inspect</span>
        </div>
      </div>
    </div>
  );
};
