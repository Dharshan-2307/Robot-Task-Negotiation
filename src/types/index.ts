// ============================================================================
// AGRISWARM — Decentralized Multi-Robot Farm Utility Monitoring & Emergency Response System
// Core Type Definitions for Poultry Farm 500+ Heterogeneous Fleet
// ============================================================================

// --- Robot Types ---

export type RobotState = 'active' | 'idle' | 'charging' | 'failed' | 'negotiating' | 'deadlocked' | 'rerouting';

// 6 Official AgriSwarm Farm Robot Categories (with backward compatibility)
export type RobotCapability =
  | 'water_inspection'       // 150 units - Water-line & pipe faults
  | 'electrical_inspection'  // 100 units - Electrical & substation faults
  | 'utility_transport'      // 100 units - Feed & material movement
  | 'emergency_response'     // 75 units - Critical incidents & thermal
  | 'communication_relay'    // 50 units - Mesh comms recovery
  | 'general_purpose'        // 25 units - Multi-task support
  // Backward-compat aliases
  | 'transport' | 'assembly' | 'inspection' | 'welding' | 'painting' | 'cleaning' | 'heavy-lift' | 'precision';

export interface Position {
  x: number;
  y: number;
}

export interface Robot {
  id: string;
  name: string;
  position: Position;
  targetPosition?: Position;
  state: RobotState;
  battery: number; // 0-100
  health: number; // 0-100
  capability: RobotCapability;
  currentTaskId?: string;
  route: Position[];
  eta?: number; // seconds
  speed: number; // units per second
  alerts: Alert[];
  lastUpdated: number;
  commRadius: number; // e.g. 100 units for local mesh
  isMeshRelay?: boolean;
}

// --- Sensor Types ---

export type SensorType = 'W1209-temp' | 'water-leak' | 'water-blockage' | 'power-pzem' | 'vibration';

export type SensorStatus = 'nominal' | 'warning' | 'critical';

export interface SensorUnit {
  id: string;
  name: string;
  type: SensorType;
  location: Position;
  zone: string;
  currentValue: number;
  unit: string;
  nominalRange: [number, number];
  criticalThreshold: number;
  status: SensorStatus;
  lastReadingTime: number;
  description: string;
}

// --- Poultry Water Pipeline Section (Step 27) ---

export interface WaterPipeSection {
  id: string;
  name: string;
  shed: string;
  location: Position;
  status: 'normal' | 'blocked' | 'leaking';
  flowRate: number; // L/min
  pressure: number; // Bar
}

// --- Poultry IoT Telemetry Log (Google Sheet format) ---
export interface IoTTelemetryRow {
  id: string;
  datetime: string;
  tem1: number;
  tem2: number;
  avgTem: number;
  humidity1: number;
  humidity2: number;
  s1: 'WATER' | 'NO_WATER';
  s2: 'WATER' | 'NO_WATER';
  motor: 'ON' | 'OFF';
  status: string; // 'NORMAL' | 'WAIT_DRY_RUN' | 'TANK_EMPTY' | 'PIPE_DAMAGE' | 'PIPE_NORMAL' | 'TANK_FULL' | 'PIPE2_ERROR'
  mode: string;   // 'MODE1' | 'MODE2' | 'MODE3' | 'MODE4'
}

// --- Fault Types ---

export type FaultCategory = 'high-temperature' | 'water-blockage' | 'water-leakage' | 'power-abnormality' | 'equipment-failure';

export type FaultStatus = 'active' | 'in-response' | 'resolved';

export interface FaultIncident {
  id: string;
  sensorId: string;
  sensorName: string;
  category: FaultCategory;
  severity: 'critical' | 'high' | 'medium';
  location: Position;
  zone: string;
  measuredValue: string;
  requiredAction: string;
  requiredCapability: RobotCapability;
  taskId?: string;
  assignedRobotId?: string;
  status: FaultStatus;
  detectedAt: number;
  resolvedAt?: number;
}

// --- Task Types ---

export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed' | 'reassigned';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  name: string;
  priority: TaskPriority;
  requiredCapability: RobotCapability;
  location: Position;
  assignedRobotId?: string;
  previousRobotId?: string;
  status: TaskStatus;
  eta?: number;
  createdAt: number;
  completedAt?: number;
  description: string;
  // Fault-response linkages
  faultId?: string;
  sensorId?: string;
  measuredReading?: string;
  requiredAction?: string;
}

// --- Negotiation Types ---

export type NegotiationReason = 'task-conflict' | 'right-of-way' | 'resource-conflict' | 'priority-override' | 'charging-station';

export type NegotiationStatus = 'in-progress' | 'resolved' | 'escalated' | 'timeout';

export interface NegotiationEvent {
  id: string;
  robotIds: string[];
  reason: NegotiationReason;
  status: NegotiationStatus;
  description: string;
  result?: string;
  startedAt: number;
  resolvedAt?: number;
  relatedTaskIds?: string[];
}

// --- Conflict / Collision Types ---

export type ConflictStatus = 'detected' | 'rerouting' | 'resolved' | 'unresolved';

export interface ConflictEvent {
  id: string;
  robotIds: string[];
  position: Position;
  status: ConflictStatus;
  description: string;
  detectedAt: number;
  resolvedAt?: number;
  rerouteTriggered: boolean;
}

// --- Deadlock Types ---

export type DeadlockStatus = 'detected' | 'recovering' | 'resolved' | 'unresolved';

export interface DeadlockEvent {
  id: string;
  robotIds: string[];
  status: DeadlockStatus;
  description: string;
  detectedAt: number;
  resolvedAt?: number;
  recoveryAction?: string;
}

// --- Alert Types ---

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertCategory = 'battery' | 'collision' | 'deadlock' | 'failure' | 'negotiation' | 'task' | 'sensor' | 'fault' | 'system';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  robotId?: string;
  taskId?: string;
  sensorId?: string;
  faultId?: string;
  timestamp: number;
  resolved: boolean;
}

// --- Live Event Feed Types ---

export type EventType =
  | 'task-assigned'
  | 'task-reassigned'
  | 'task-completed'
  | 'task-failed'
  | 'negotiation-started'
  | 'negotiation-completed'
  | 'collision-detected'
  | 'robot-rerouted'
  | 'deadlock-detected'
  | 'deadlock-resolved'
  | 'low-battery'
  | 'robot-failure'
  | 'recovery-completed'
  | 'charging-started'
  | 'charging-completed'
  | 'sensor-alert'
  | 'fault-detected'
  | 'fault-resolved'
  | 'task-migrated'
  | 'controller-offline'
  | 'controller-online'
  | 'comm-blackout'
  | 'fleet-scaled';

export interface LiveEvent {
  id: string;
  type: EventType;
  message: string;
  robotIds?: string[];
  taskId?: string;
  sensorId?: string;
  faultId?: string;
  timestamp: number;
  severity: AlertSeverity;
}

// --- Analytics Types ---

export interface FleetAnalytics {
  totalRobots: number;
  activeRobots: number;
  idleRobots: number;
  chargingRobots: number;
  failedRobots: number;
  lowBatteryRobots: number;
  averageBattery: number;
  totalTasks: number;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalConflicts: number;
  totalDeadlocks: number;
  totalNegotiations: number;
  totalRecoveries: number;
  totalReassignments: number;
  averageEta: number;
  taskSuccessRate: number;
  robotUtilization: number;
  activeFaultsCount: number;
  resolvedFaultsCount: number;
  sensorsAlertCount: number;
  // AgriSwarm Specific Quotas
  waterRobotsCount: number;
  electricalRobotsCount: number;
  transportRobotsCount: number;
  emergencyRobotsCount: number;
  relayRobotsCount: number;
  generalRobotsCount: number;
}

// --- Hero Demo Storyline Types ---

export type HeroDemoStep =
  | 'idle'
  | 'sensor-spike'
  | 'fault-triggered'
  | 'negotiation-bidding'
  | 'robot-assigned'
  | 'conflict-reroute'
  | 'robot-failure'
  | 'task-migration'
  | 'recovery-complete'
  | 'finished';

export interface HeroDemoState {
  isActive: boolean;
  currentStep: HeroDemoStep;
  stepNumber: number; // 1 to 7
  totalSteps: number;
  title: string;
  description: string;
  primaryRobotId?: string;
  backupRobotId?: string;
  sensorId?: string;
  faultId?: string;
  taskId?: string;
  startedAt: number;
}

// --- Simulation Types ---

export type SimulationState = 'stopped' | 'running' | 'paused';

export interface SimulationConfig {
  state: SimulationState;
  speed: number; // multiplier: 0.5, 1, 2, 5, 10
  robotCount: number;
  taskGenerationRate: number; // tasks per minute
  isControllerOnline: boolean; // Step 20: Central Coordinator status
  commRangeUnits: number; // Step 11: P2P radio radius (100 units)
}

// --- Connection Types ---

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'simulated';

// --- Map Types ---

export interface MapObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  type?: 'shed' | 'tank' | 'substation' | 'restricted' | 'pump';
}

export interface MapConfig {
  width: number;
  height: number;
  gridSize: number;
  obstacles: MapObstacle[];
  chargingStations: Position[];
  taskStations: Position[];
  sensors: SensorUnit[];
  waterPipes: WaterPipeSection[];
}
