# FleetOps Nexus — Multi-Robot Task Negotiation Engine

A high-performance industrial command-center dashboard for visualizing and managing **500+ autonomous robots**, Contract-Net task allocation, peer-to-peer negotiation protocols, and real-time conflict & deadlock resolution.

---

## 🌟 Key Features

1. **60 FPS Hardware-Accelerated 2D Radar (`FleetMap.tsx`)**:
   - Custom HTML5 Canvas 2D engine with GPU acceleration.
   - Smooth mouse pan and scroll-wheel zoom navigation.
   - Real-time rendering of 500+ robots, waypoints, and animated trajectory trails.
   - Dynamic conflict warning halos and animated peer negotiation laser links.
   - Instant $O(1)$ spatial click-to-select robot inspector.

2. **Autonomous Simulation Engine (`SimulationEngine.ts`)**:
   - Built-in multi-agent simulation simulating 500 autonomous agents.
   - Contract-Net Protocol (CNP) for task bidding and capability matching.
   - Peer-to-peer right-of-way negotiation and intersection yield logic.
   - Proximity collision avoidance and dynamic waypoint replanning.
   - Battery consumption curves with autonomous low-battery charging dispatch.
   - Deadlock detection clusters and automated recovery routines.

3. **Mission Control Dashboard**:
   - **Status KPI Grid**: Live counts for total fleet, active, idle, charging, failed, low battery, and tasks.
   - **Simulation Controls**: Play, Pause, Resume, Reset, speed multipliers (0.5x–10x), and injection triggers (Inject Failure, Force Conflict, Force Deadlock).
   - **Robot Details Inspector**: Telemetry readouts, route coordinates, health & battery gauges, and assigned task specs.
   - **Task Management Table**: Filterable, searchable, and sortable task allocation queues.
   - **Negotiation Monitor**: Dedicated viewer for robot-to-robot negotiation events and resolution states.
   - **Collision & Deadlock Threat Matrix**: Active collision warnings and replanning status.
   - **Live Event Stream**: Real-time activity log with severity filtering (Critical, Warning, Info).
   - **Central Alert Center**: System warnings and notifications drawer.
   - **Analytics Suite**: Telemetry charts using Recharts (fleet utilization, battery distributions, throughput).

4. **Dual-Mode Transport Architecture**:
   - 1-Click hot-swap between **Autonomous Simulated Engine** and **Live WebSocket / REST Backend** (`TransportAdapter`).

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18+ (Node 20 recommended)
* npm or yarn or pnpm

### 2. Installation
```bash
git clone <repo-url>
cd Task-Negotiation-Robot
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Production Build
```bash
npm run build
npm start
```

---

## ⚙️ Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
```

Refer to [`API_CONTRACT.md`](./API_CONTRACT.md) for complete backend message schemas and REST endpoint specifications.

---

## 🚢 Deployment on Vercel

This repository is optimized for zero-config 1-click deployment on [Vercel](https://vercel.com):

1. Push your code to GitHub / GitLab.
2. Import the project in Vercel.
3. Configure the `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` environment variables if connecting to a live backend.
4. Click **Deploy**.
