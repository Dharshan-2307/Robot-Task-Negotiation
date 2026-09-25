# Multi-Robot Task Negotiation Engine — Backend Integration Contract

This document specifies the exact REST and WebSocket protocol schemas expected by the frontend command center (`FleetOps Nexus`).

---

## 1. Environment Variables Configuration

Set these in `.env.local` or on your hosting provider (e.g., Vercel):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
```

---

## 2. Real-Time Telemetry WebSocket Protocol

* **Endpoint:** `ws://<host>:<port>/ws/telemetry`
* **Transport:** Full-duplex JSON frames

### Inbound Frame: `telemetry_sync`
The backend emits high-frequency snapshots (typically 10–30 Hz):

```json
{
  "type": "telemetry_sync",
  "timestamp": 1727239800000,
  "robots": [
    {
      "id": "R-0001",
      "name": "Robot 1",
      "position": { "x": 340.5, "y": 210.8 },
      "targetPosition": { "x": 600.0, "y": 450.0 },
      "state": "active",
      "battery": 82.5,
      "health": 95.0,
      "capability": "transport",
      "currentTaskId": "T-0142",
      "route": [
        { "x": 400.0, "y": 300.0 },
        { "x": 600.0, "y": 450.0 }
      ],
      "eta": 18,
      "speed": 3.2,
      "alerts": [],
      "lastUpdated": 1727239800000
    }
  ],
  "tasks": [
    {
      "id": "T-0142",
      "name": "Transport payload to Zone A",
      "priority": "high",
      "requiredCapability": "transport",
      "location": { "x": 600.0, "y": 450.0 },
      "assignedRobotId": "R-0001",
      "status": "in-progress",
      "eta": 18,
      "createdAt": 1727239700000,
      "description": "Requires transport capability at (600, 450)"
    }
  ],
  "negotiations": [
    {
      "id": "N-0012",
      "robotIds": ["R-0001", "R-0024"],
      "reason": "right-of-way",
      "status": "in-progress",
      "description": "R-0001 and R-0024 negotiating intersection right-of-way",
      "startedAt": 1727239798000
    }
  ],
  "conflicts": [
    {
      "id": "CF-0004",
      "robotIds": ["R-0001", "R-0024"],
      "position": { "x": 380.0, "y": 280.0 },
      "status": "rerouting",
      "description": "Collision proximity risk detected",
      "detectedAt": 1727239795000,
      "rerouteTriggered": true
    }
  ],
  "deadlocks": [
    {
      "id": "DL-0001",
      "robotIds": ["R-0003", "R-0007", "R-0019"],
      "status": "recovering",
      "description": "Narrow corridor 3-agent deadlock",
      "detectedAt": 1727239780000,
      "recoveryAction": "Route replanning"
    }
  ],
  "events": [
    {
      "id": "E-0089",
      "type": "negotiation-started",
      "message": "R-0001 and R-0024 entered peer negotiation",
      "robotIds": ["R-0001", "R-0024"],
      "timestamp": 1727239798000,
      "severity": "warning"
    }
  ],
  "analytics": {
    "totalRobots": 500,
    "activeRobots": 340,
    "idleRobots": 120,
    "chargingRobots": 35,
    "failedRobots": 5,
    "lowBatteryRobots": 12,
    "averageBattery": 74,
    "totalTasks": 280,
    "activeTasks": 210,
    "pendingTasks": 40,
    "completedTasks": 30,
    "failedTasks": 0,
    "totalConflicts": 8,
    "totalDeadlocks": 2,
    "totalNegotiations": 14,
    "totalRecoveries": 2,
    "totalReassignments": 5,
    "averageEta": 24,
    "taskSuccessRate": 100,
    "robotUtilization": 68
  }
}
```

### Outbound Commands (Frontend → Backend)
When the operator triggers actions from the UI:

```json
{
  "action": "start_simulation" | "pause_simulation" | "reset_simulation",
  "speed": 1.0
}
```

```json
{
  "action": "inject_fault",
  "faultType": "failure" | "conflict" | "deadlock",
  "targetRobotId": "R-0001"
}
```

---

## 3. REST API Endpoints (Fallback / Polling)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/fleet/status` | Returns top-level fleet KPI numbers |
| `GET` | `/api/v1/robots` | Returns array of all 500+ robot positions and states |
| `GET` | `/api/v1/robots/{id}` | Returns single robot telemetry, route, and diagnostics |
| `GET` | `/api/v1/tasks` | Returns all active, pending, and completed tasks |
| `POST` | `/api/v1/tasks` | Dispatches a new task to the fleet |
| `GET` | `/api/v1/negotiations` | Returns list of active peer-to-peer negotiation sessions |
| `GET` | `/api/v1/conflicts` | Returns active collision risks and deadlocks |
| `POST` | `/api/v1/simulation/control` | Sends run/pause/speed commands to simulation worker |
