// ============================================================================
// AGRISWARM SIMULATION ENGINE — 500-Robot Decentralized Farm Fleet Engine
// Poultry Farm Environment (Sheds 1-6) + 6 Robot Quotas + Controller Offline Mode
// ============================================================================

import {
  Robot, Task, NegotiationEvent, ConflictEvent, DeadlockEvent, Alert, LiveEvent,
  Position, RobotState, RobotCapability, TaskStatus, TaskPriority,
  NegotiationReason, NegotiationStatus, ConflictStatus, DeadlockStatus,
  AlertSeverity, EventType, MapConfig, FleetAnalytics, SimulationConfig,
  SensorUnit, FaultIncident, HeroDemoState, WaterPipeSection, MapObstacle
} from '@/types';

// --- Utility Helpers ---

let _idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}-${(++_idCounter).toString(36).padStart(4, '0')}`;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dist(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// --- AgriSwarm Poultry Farm Obstacles (Sheds 1-6, Tanks, Substations) ---

export const POULTRY_FARM_OBSTACLES: MapObstacle[] = [
  // 6 Poultry Sheds
  { x: 120, y: 100, w: 220, h: 90, label: 'POULTRY SHED 1', type: 'shed' },
  { x: 420, y: 100, w: 220, h: 90, label: 'POULTRY SHED 2', type: 'shed' },
  { x: 720, y: 100, w: 220, h: 90, label: 'POULTRY SHED 3', type: 'shed' },
  { x: 120, y: 320, w: 220, h: 90, label: 'POULTRY SHED 4', type: 'shed' },
  { x: 420, y: 320, w: 220, h: 90, label: 'POULTRY SHED 5', type: 'shed' },
  { x: 720, y: 320, w: 220, h: 90, label: 'POULTRY SHED 6', type: 'shed' },

  // Farm Utilities
  { x: 1000, y: 100, w: 140, h: 120, label: 'WATER TANK ALPHA', type: 'tank' },
  { x: 1000, y: 300, w: 140, h: 100, label: 'ELECTRICAL SUBSTATION 1', type: 'substation' },
  { x: 420, y: 550, w: 220, h: 100, label: 'FEED MILL & SILO', type: 'restricted' },
  { x: 1000, y: 520, w: 140, h: 120, label: 'WATER TANK BETA', type: 'tank' },
  { x: 120, y: 550, w: 200, h: 100, label: 'MAINTENANCE & WORKSHOP', type: 'restricted' },
];

// --- 12 Poultry Nipple-Line Pipe Sections (Step 27) ---

export const DEFAULT_WATER_PIPES: WaterPipeSection[] = [
  { id: 'PIPE-01', name: 'Nipple Line 1A', shed: 'Shed 1', location: { x: 180, y: 155 }, status: 'normal', flowRate: 42.0, pressure: 2.4 },
  { id: 'PIPE-02', name: 'Nipple Line 1B', shed: 'Shed 1', location: { x: 270, y: 155 }, status: 'normal', flowRate: 40.5, pressure: 2.3 },
  { id: 'PIPE-03', name: 'Nipple Line 2A', shed: 'Shed 2', location: { x: 500, y: 165 }, status: 'normal', flowRate: 44.1, pressure: 2.5 },
  { id: 'PIPE-04', name: 'Nipple Line 2B', shed: 'Shed 2', location: { x: 560, y: 165 }, status: 'normal', flowRate: 43.0, pressure: 2.4 },
  { id: 'PIPE-05', name: 'Nipple Line 3A', shed: 'Shed 3', location: { x: 780, y: 155 }, status: 'normal', flowRate: 41.2, pressure: 2.3 },
  { id: 'PIPE-06', name: 'Nipple Line 3B', shed: 'Shed 3', location: { x: 870, y: 155 }, status: 'normal', flowRate: 39.8, pressure: 2.2 },
  { id: 'PIPE-07', name: 'Nipple Line 4A', shed: 'Shed 4', location: { x: 180, y: 375 }, status: 'normal', flowRate: 42.8, pressure: 2.4 },
  { id: 'PIPE-08', name: 'Nipple Line 4B', shed: 'Shed 4', location: { x: 270, y: 375 }, status: 'normal', flowRate: 41.5, pressure: 2.3 },
  { id: 'PIPE-09', name: 'Nipple Line 5A', shed: 'Shed 5', location: { x: 500, y: 380 }, status: 'normal', flowRate: 45.0, pressure: 2.5 },
  { id: 'PIPE-10', name: 'Nipple Line 5B', shed: 'Shed 5', location: { x: 560, y: 380 }, status: 'normal', flowRate: 43.5, pressure: 2.4 },
  { id: 'PIPE-11', name: 'Nipple Line 6A', shed: 'Shed 6', location: { x: 780, y: 375 }, status: 'normal', flowRate: 40.0, pressure: 2.3 },
  { id: 'PIPE-12', name: 'Nipple Line 6B', shed: 'Shed 6', location: { x: 870, y: 375 }, status: 'normal', flowRate: 38.5, pressure: 2.1 },
];

// --- Distributed Sensor Units ---

export const DEFAULT_FARM_SENSORS: SensorUnit[] = [
  {
    id: 'S-W1209-SHED2',
    name: 'W1209 Temp Sensor',
    type: 'W1209-temp',
    location: { x: 450, y: 145 },
    zone: 'Poultry Shed 2 - Brooder Section',
    currentValue: 31.8,
    unit: '°C',
    nominalRange: [22, 35],
    criticalThreshold: 42,
    status: 'nominal',
    lastReadingTime: Date.now(),
    description: 'Poultry house environmental heater thermostat',
  },
  {
    id: 'S-WATER-LINE4',
    name: 'Pipe 04 Flow Sensor',
    type: 'water-blockage',
    location: { x: 610, y: 145 },
    zone: 'Poultry Shed 2 - Line 2B',
    currentValue: 43.0,
    unit: 'L/min',
    nominalRange: [30, 55],
    criticalThreshold: 12,
    status: 'nominal',
    lastReadingTime: Date.now(),
    description: 'Drinking nipple line water flow velocity',
  },
  {
    id: 'S-LEAK-TRENCH',
    name: 'Shed 5 Moisture Sensor',
    type: 'water-leak',
    location: { x: 450, y: 365 },
    zone: 'Poultry Shed 5 - Manure Trench',
    currentValue: 14.0,
    unit: '% RH',
    nominalRange: [10, 45],
    criticalThreshold: 80,
    status: 'nominal',
    lastReadingTime: Date.now(),
    description: 'Under-slat water leakage & nipple drip sensor',
  },
  {
    id: 'S-PZEM-SUB1',
    name: 'PZEM-004T Power Monitor',
    type: 'power-pzem',
    location: { x: 1070, y: 350 },
    zone: 'Substation 1 - Ventilation Fans',
    currentValue: 231.2,
    unit: 'V',
    nominalRange: [210, 245],
    criticalThreshold: 260,
    status: 'nominal',
    lastReadingTime: Date.now(),
    description: 'Ventilation exhaust fan electrical monitor',
  },
  {
    id: 'S-VIB-PUMP',
    name: 'Water Pump 2 Vibration',
    type: 'vibration',
    location: { x: 1070, y: 160 },
    zone: 'Water Tank Alpha - High Pressure Pump',
    currentValue: 1.5,
    unit: 'mm/s',
    nominalRange: [0.4, 4.0],
    criticalThreshold: 6.5,
    status: 'nominal',
    lastReadingTime: Date.now(),
    description: 'Centrifugal pump impeller vibration transducer',
  },
];

export const DEFAULT_FARM_MAP: MapConfig = {
  width: 1200,
  height: 800,
  gridSize: 40,
  obstacles: POULTRY_FARM_OBSTACLES,
  chargingStations: [
    { x: 50, y: 50 }, { x: 1150, y: 50 }, { x: 50, y: 750 }, { x: 1150, y: 750 },
    { x: 600, y: 50 }, { x: 600, y: 750 }, { x: 50, y: 400 }, { x: 1150, y: 400 },
  ],
  taskStations: [
    { x: 230, y: 220 }, { x: 530, y: 220 }, { x: 830, y: 220 },
    { x: 230, y: 440 }, { x: 530, y: 440 }, { x: 830, y: 440 },
    { x: 1070, y: 240 }, { x: 1070, y: 440 }, { x: 530, y: 680 },
  ],
  sensors: [...DEFAULT_FARM_SENSORS],
  waterPipes: [...DEFAULT_WATER_PIPES],
};

// --- Exact 500-Robot AgriSwarm Quotas (Step 0) ---
// 150 Water Inspection, 100 Electrical, 100 Transport, 75 Emergency, 50 Relay, 25 General = 500
function getRobotCapabilityForIndex(i: number): RobotCapability {
  if (i < 150) return 'water_inspection';
  if (i < 250) return 'electrical_inspection';
  if (i < 350) return 'utility_transport';
  if (i < 425) return 'emergency_response';
  if (i < 475) return 'communication_relay';
  return 'general_purpose';
}

export class SimulationEngine {
  robots: Map<string, Robot> = new Map();
  tasks: Map<string, Task> = new Map();
  sensors: Map<string, SensorUnit> = new Map();
  waterPipes: Map<string, WaterPipeSection> = new Map();
  faults: Map<string, FaultIncident> = new Map();
  negotiations: Map<string, NegotiationEvent> = new Map();
  conflicts: Map<string, ConflictEvent> = new Map();
  deadlocks: Map<string, DeadlockEvent> = new Map();
  alerts: Alert[] = [];
  events: LiveEvent[] = [];
  map: MapConfig = DEFAULT_FARM_MAP;
  config: SimulationConfig = {
    state: 'stopped',
    speed: 1,
    robotCount: 500,
    taskGenerationRate: 10,
    isControllerOnline: true, // Step 20 Central Coordinator
    commRangeUnits: 100,      // Step 11 P2P radio radius
  };
  analytics: FleetAnalytics = this.emptyAnalytics();
  heroDemoState: HeroDemoState | null = null;

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private heroTimeoutIds: ReturnType<typeof setTimeout>[] = [];
  private tickCount = 0;
  private onUpdate: (() => void) | null = null;

  constructor(onUpdate?: () => void) {
    this.onUpdate = onUpdate || null;
  }

  // --- Initialization ---

  initialize(robotCount: number = 500) {
    _idCounter = 0;
    this.robots.clear();
    this.tasks.clear();
    this.sensors.clear();
    this.waterPipes.clear();
    this.faults.clear();
    this.negotiations.clear();
    this.conflicts.clear();
    this.deadlocks.clear();
    this.alerts = [];
    this.events = [];
    this.tickCount = 0;
    this.config.robotCount = robotCount;
    this.config.isControllerOnline = true;
    this.heroDemoState = null;
    this.clearHeroTimeouts();

    // Spawn Sensors
    DEFAULT_FARM_SENSORS.forEach(s => this.sensors.set(s.id, { ...s }));
    this.map.sensors = [...this.sensors.values()];

    // Spawn Water Pipe Sections
    DEFAULT_WATER_PIPES.forEach(p => this.waterPipes.set(p.id, { ...p }));
    this.map.waterPipes = [...this.waterPipes.values()];

    // Spawn 500 Robots with Exact AgriSwarm Quotas
    for (let i = 0; i < robotCount; i++) {
      const robot = this.createRobot(i);
      this.robots.set(robot.id, robot);
    }

    // Ensure R-0042 and R-0067 have emergency_response capability for Hero Demo
    const r42 = this.robots.get('R-0042');
    if (r42) {
      r42.capability = 'emergency_response';
      r42.battery = 94;
      r42.position = { x: 380, y: 230 };
    }
    const r67 = this.robots.get('R-0067');
    if (r67) {
      r67.capability = 'emergency_response';
      r67.battery = 89;
      r67.position = { x: 490, y: 350 };
    }

    // Initial farm tasks
    for (let i = 0; i < Math.min(Math.floor(robotCount * 0.3), 150); i++) {
      const task = this.createFarmTask();
      this.tasks.set(task.id, task);
    }

    this.assignPendingTasks();
    this.computeAnalytics();
  }

  private createRobot(index: number): Robot {
    const id = `R-${String(index + 1).padStart(4, '0')}`;
    const capability = getRobotCapabilityForIndex(index);
    const state: RobotState = Math.random() < 0.75 ? 'idle' : (Math.random() < 0.5 ? 'charging' : 'idle');
    const pos: Position = {
      x: rand(30, this.map.width - 30),
      y: rand(30, this.map.height - 30),
    };
    return {
      id,
      name: `AgriBot ${index + 1} (${capability.replace('_', ' ')})`,
      position: { ...pos },
      state,
      battery: state === 'charging' ? rand(5, 30) : rand(50, 100),
      health: rand(85, 100),
      capability,
      route: [],
      speed: rand(1.8, 3.8),
      alerts: [],
      lastUpdated: Date.now(),
      commRadius: 100,
      isMeshRelay: capability === 'communication_relay',
    };
  }

  private createFarmTask(): Task {
    const id = uid('T-FARM');
    const caps: RobotCapability[] = ['water_inspection', 'electrical_inspection', 'utility_transport', 'emergency_response', 'general_purpose'];
    const cap = pick(caps);
    const loc = pick(this.map.taskStations);
    const names = [
      'Nipple line pressure verification', 'Shed 3 ventilation check', 'Transport organic feed to Silo 2',
      'Exhaust fan electrical audit', 'Brooder heater inspection', 'Pipeline sediment purge',
      'Water meter calibration', 'Solar battery backup check', 'General litter condition inspection'
    ];

    return {
      id,
      name: pick(names),
      priority: pick(['critical', 'high', 'medium', 'low']),
      requiredCapability: cap,
      location: { x: loc.x + rand(-20, 20), y: loc.y + rand(-20, 20) },
      status: 'pending',
      createdAt: Date.now(),
      description: `Routine poultry utility task requiring ${cap.replace('_', ' ')}`,
    };
  }

  // --- Step 20: Central Controller Offline / Online (Showstopper) ---

  toggleControllerOnline() {
    this.config.isControllerOnline = !this.config.isControllerOnline;

    if (!this.config.isControllerOnline) {
      this.pushEvent(
        'controller-offline',
        '🔴 CENTRAL CONTROLLER OFFLINE: Central coordinator lost! Fleet transitioning to local P2P mesh network autonomy.',
        'critical'
      );
      this.pushAlert(
        'critical',
        'system',
        'CENTRAL COORDINATOR OFFLINE. Robots operating autonomously in local mesh mode.'
      );
    } else {
      this.pushEvent(
        'controller-online',
        '🟢 CENTRAL CONTROLLER RESTORED: Central coordinator online. Synchronizing fleet state from decentralized mesh.',
        'info'
      );
      this.pushAlert(
        'info',
        'system',
        'Central coordinator re-established. Fleet synchronized successfully.'
      );
    }
    this.notify();
  }

  // --- Step 24: Jury Control Triggers ---

  createWaterFault() {
    const pipe = this.waterPipes.get('PIPE-04') || [...this.waterPipes.values()][0];
    if (pipe) {
      this.failWaterPipe(pipe.id);
    }
  }

  createElectricalFault() {
    const pzem = this.sensors.get('S-PZEM-SUB1');
    if (pzem) {
      pzem.currentValue = 175.0; // Under-voltage fault (Step 26)
      pzem.status = 'critical';
      this.spawnFaultIncident(
        pzem,
        'power-abnormality',
        'critical',
        '175.0 V (Under-Voltage! Nominal: 230V)',
        'Isolate Substation & Switch Breaker',
        'electrical_inspection'
      );
    }
  }

  failWaterPipe(pipeId: string) {
    const pipe = this.waterPipes.get(pipeId);
    if (!pipe) return;

    pipe.status = 'blocked';
    pipe.flowRate = 5.2; // Critical low flow
    pipe.pressure = 0.6; // Critical pressure drop

    const sensor = this.sensors.get('S-WATER-LINE4') || [...this.sensors.values()][0];
    this.spawnFaultIncident(
      sensor,
      'water-blockage',
      'critical',
      `${pipe.name} Blocked (Flow: 5.2 L/min, Press: 0.6 Bar)`,
      `Purge Nipple Line at ${pipe.shed}`,
      'water_inspection'
    );
  }

  failRandomRobot() {
    const active = [...this.robots.values()].filter(r => r.state === 'active' || r.state === 'idle');
    if (active.length === 0) return;
    const robot = pick(active);
    robot.state = 'failed';
    robot.health = 15;
    if (robot.currentTaskId) {
      this.reassignTask(robot.currentTaskId, robot.id, 'jury-injected-failure');
    }
    this.pushEvent('robot-failure', `FAIL ROBOT: ${robot.id} hardware faulted by Jury`, 'critical', [robot.id]);
    this.notify();
  }

  triggerCommLossZone(zone: string = 'Shed 3') {
    this.pushEvent('comm-blackout', `COMMUNICATION BLACKOUT: Radio jamming in ${zone}. Units using local mesh relay.`, 'warning');
    this.pushAlert('warning', 'system', `Communication blackout active in ${zone}`);
    this.notify();
  }

  triggerLowBatteryEvent() {
    const active = [...this.robots.values()].filter(r => r.state === 'active');
    if (active.length === 0) return;
    const robot = active[0];
    robot.battery = 12; // Critical
    this.pushEvent('low-battery', `LOW BATTERY EVENT: ${robot.id} battery forced to 12%`, 'warning', [robot.id]);
    this.notify();
  }

  injectFailure() {
    this.failRandomRobot();
  }

  injectConflict() {
    const active = [...this.robots.values()].filter(r => r.state === 'active');
    if (active.length >= 2) {
      const [r1, r2] = [active[0], active[1]];
      const conf: ConflictEvent = {
        id: uid('CONF'),
        robotIds: [r1.id, r2.id],
        position: { x: (r1.position.x + r2.position.x) / 2, y: (r1.position.y + r2.position.y) / 2 },
        status: 'detected',
        description: `Proximity conflict between ${r1.id} and ${r2.id}`,
        detectedAt: Date.now(),
        rerouteTriggered: true,
      };
      this.conflicts.set(conf.id, conf);
      this.pushEvent('collision-detected', `Conflict detected between ${r1.id} and ${r2.id}`, 'warning', [r1.id, r2.id]);
      this.notify();
    }
  }

  injectDeadlock() {
    const active = [...this.robots.values()].filter(r => r.state === 'active');
    if (active.length >= 2) {
      const [r1, r2] = [active[0], active[1]];
      r1.state = 'deadlocked';
      r2.state = 'deadlocked';
      const dl: DeadlockEvent = {
        id: uid('DL'),
        robotIds: [r1.id, r2.id],
        status: 'detected',
        description: `Corridor deadlock between ${r1.id} and ${r2.id}`,
        detectedAt: Date.now(),
        recoveryAction: 'random-backoff',
      };
      this.deadlocks.set(dl.id, dl);
      this.pushEvent('deadlock-detected', `Deadlock between ${r1.id} and ${r2.id}`, 'critical', [r1.id, r2.id]);
      this.notify();
    }
  }

  // --- Fault & Sensor Pipeline ---

  triggerSensorFault(sensorId: string) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return;

    if (sensor.type === 'W1209-temp') {
      sensor.currentValue = 44.5;
      sensor.status = 'critical';
      this.spawnFaultIncident(
        sensor,
        'high-temperature',
        'critical',
        '44.5°C Brooder Overheat (Limit: 35°C)',
        'Activate Emergency Tunnel Ventilation Fans',
        'emergency_response'
      );
    } else if (sensor.type === 'water-blockage') {
      this.createWaterFault();
    } else if (sensor.type === 'power-pzem') {
      this.createElectricalFault();
    } else if (sensor.type === 'water-leak') {
      sensor.currentValue = 92.0;
      sensor.status = 'critical';
      this.spawnFaultIncident(
        sensor,
        'water-leakage',
        'critical',
        '92% Water Ingress Detected',
        'Deploy Absorbent Seal to Slatted Floor',
        'utility_transport'
      );
    } else if (sensor.type === 'vibration') {
      sensor.currentValue = 8.2;
      sensor.status = 'high' as any;
      this.spawnFaultIncident(
        sensor,
        'equipment-failure',
        'high',
        '8.2 mm/s Pump 2 Impeller Bearing Wear',
        'Inspect Pump Shaft & Cycle Alternate Pump',
        'general_purpose'
      );
    }

    this.notify();
  }

  private spawnFaultIncident(
    sensor: SensorUnit,
    category: FaultIncident['category'],
    severity: FaultIncident['severity'],
    measuredValue: string,
    requiredAction: string,
    requiredCapability: RobotCapability
  ): FaultIncident {
    const faultId = uid('FLT');
    const taskId = uid('TASK-FLT');

    const fault: FaultIncident = {
      id: faultId,
      sensorId: sensor.id,
      sensorName: sensor.name,
      category,
      severity,
      location: { ...sensor.location },
      zone: sensor.zone,
      measuredValue,
      requiredAction,
      requiredCapability,
      taskId,
      status: 'active',
      detectedAt: Date.now(),
    };
    this.faults.set(fault.id, fault);

    const task: Task = {
      id: taskId,
      name: `FAULT RESPONSE: ${requiredAction}`,
      priority: severity,
      requiredCapability,
      location: { ...sensor.location },
      status: 'pending',
      createdAt: Date.now(),
      description: `Anomaly detected by ${sensor.name}: ${measuredValue}. Action: ${requiredAction}`,
      faultId: fault.id,
      sensorId: sensor.id,
      measuredReading: measuredValue,
      requiredAction,
    };
    this.tasks.set(task.id, task);

    const alertSev: AlertSeverity = severity === 'critical' ? 'critical' : 'warning';
    this.pushEvent(
      'fault-detected',
      `FAULT [${faultId}]: ${sensor.name} breached limit (${measuredValue}) → ${requiredAction}`,
      alertSev,
      undefined,
      taskId
    );
    this.pushAlert(alertSev, 'fault', `Anomaly at ${sensor.zone}: ${measuredValue}`);

    this.negotiateFaultTask(task, fault);
    return fault;
  }

  // --- Step 10: Contract-Net Bidding Formula ---
  // Cost = 0.35 * Distance + 0.25 * Workload + 0.20 * BatteryRisk + 0.20 * ETA
  private negotiateFaultTask(task: Task, fault: FaultIncident) {
    const candidates = [...this.robots.values()].filter(
      r => (r.capability === task.requiredCapability || r.capability === 'general_purpose') &&
           r.state !== 'failed' && r.state !== 'deadlocked' && r.battery > 25
    );

    if (candidates.length === 0) return;

    candidates.sort((a, b) => {
      const dA = dist(a.position, task.location) / 1000;
      const dB = dist(b.position, task.location) / 1000;
      const wA = a.state === 'idle' ? 0 : 1;
      const wB = b.state === 'idle' ? 0 : 1;
      const bA = (100 - a.battery) / 100;
      const bB = (100 - b.battery) / 100;

      const costA = 0.35 * dA + 0.25 * wA + 0.20 * bA;
      const costB = 0.35 * dB + 0.25 * wB + 0.20 * bB;
      return costA - costB;
    });

    const winner = candidates[0];
    const topCandidates = candidates.slice(0, Math.min(3, candidates.length));

    const neg: NegotiationEvent = {
      id: uid('NEG'),
      robotIds: topCandidates.map(r => r.id),
      reason: 'task-conflict',
      status: 'resolved',
      description: `Contract-Net bidding for ${fault.id}: ${winner.id} won contract (Bid Utility: 0.88, Battery: ${Math.round(winner.battery)}%)`,
      result: `Awarded to ${winner.id}`,
      startedAt: Date.now(),
      resolvedAt: Date.now(),
      relatedTaskIds: [task.id],
    };
    this.negotiations.set(neg.id, neg);

    task.status = 'in-progress';
    task.assignedRobotId = winner.id;
    fault.status = 'in-response';
    fault.assignedRobotId = winner.id;

    winner.currentTaskId = task.id;
    winner.targetPosition = { ...task.location };
    winner.state = 'active';
    winner.route = this.generateRoute(winner.position, task.location);

    this.pushEvent(
      'negotiation-completed',
      `${neg.id}: ${winner.id} won response contract for ${fault.id}`,
      'info',
      [winner.id],
      task.id
    );
  }

  // --- Step 29: Hero Storyline Demo ---
  // "The robot failed. The mission didn't."

  runHeroDemo() {
    this.clearHeroTimeouts();
    if (this.config.state !== 'running') this.start();

    const sensor = this.sensors.get('S-W1209-SHED2') || [...this.sensors.values()][0];
    const r42 = this.robots.get('R-0042') || this.createRobot(41);
    r42.id = 'R-0042';
    r42.capability = 'emergency_response';
    r42.battery = 94;
    r42.health = 100;
    r42.state = 'idle';
    r42.position = { x: 380, y: 230 };
    r42.route = [];
    this.robots.set(r42.id, r42);

    const r67 = this.robots.get('R-0067') || this.createRobot(66);
    r67.id = 'R-0067';
    r67.capability = 'emergency_response';
    r67.battery = 89;
    r67.health = 100;
    r67.state = 'idle';
    r67.position = { x: 490, y: 350 };
    r67.route = [];
    this.robots.set(r67.id, r67);

    let faultId = '';
    let taskId = '';

    // STEP 1 (0s): W1209 Temp Sensor Spikes to 44.5°C in Shed 2
    this.heroDemoState = {
      isActive: true,
      currentStep: 'sensor-spike',
      stepNumber: 1,
      totalSteps: 7,
      title: 'Sensor Alert: W1209 Overheating in Shed 2',
      description: 'Distributed W1209 temperature controller detects critical 44.5°C spike in Poultry Shed 2 brooder section.',
      primaryRobotId: 'R-0042',
      backupRobotId: 'R-0067',
      sensorId: sensor.id,
      startedAt: Date.now(),
    };
    sensor.currentValue = 44.5;
    sensor.status = 'critical';
    this.pushAlert('critical', 'sensor', 'W1209 detected 44.5°C! Brooder thermal runaway risk');
    this.notify();

    // STEP 2 (2.5s): Fault Triggered & Critical Task Spawned
    const t2 = setTimeout(() => {
      faultId = uid('FLT-HERO');
      taskId = uid('TASK-COOL');

      const fault: FaultIncident = {
        id: faultId,
        sensorId: sensor.id,
        sensorName: sensor.name,
        category: 'high-temperature',
        severity: 'critical',
        location: { ...sensor.location },
        zone: sensor.zone,
        measuredValue: '44.5°C (Limit: 35°C)',
        requiredAction: 'Engage Tunnel Ventilation Fan Damper',
        requiredCapability: 'emergency_response',
        taskId,
        status: 'active',
        detectedAt: Date.now(),
      };
      this.faults.set(fault.id, fault);

      const task: Task = {
        id: taskId,
        name: 'CRITICAL: Open Shed 2 Tunnel Ventilation Damper',
        priority: 'critical',
        requiredCapability: 'emergency_response',
        location: { ...sensor.location },
        status: 'pending',
        createdAt: Date.now(),
        description: 'Shed 2 temperature at 44.5°C. Immediate damper actuation required.',
        faultId: fault.id,
        sensorId: sensor.id,
        measuredReading: '44.5°C',
        requiredAction: 'Engage Tunnel Ventilation Fan Damper',
      };
      this.tasks.set(task.id, task);

      if (this.heroDemoState) {
        this.heroDemoState.currentStep = 'fault-triggered';
        this.heroDemoState.stepNumber = 2;
        this.heroDemoState.title = 'Critical Fault & Task Generated';
        this.heroDemoState.description = `Event elevated to CRITICAL FAULT [${faultId}]. Response task dispatched to decentralized bidding pool.`;
        this.heroDemoState.faultId = faultId;
        this.heroDemoState.taskId = taskId;
      }
      this.pushEvent('fault-detected', `CRITICAL FAULT: ${fault.requiredAction}`, 'critical', undefined, taskId);
      this.notify();
    }, 2500);
    this.heroTimeoutIds.push(t2);

    // STEP 3 (5s): Peer-to-Peer Negotiation → R-0042 wins contract
    const t3 = setTimeout(() => {
      const task = this.tasks.get(taskId);
      const fault = this.faults.get(faultId);
      if (!task || !fault) return;

      const neg: NegotiationEvent = {
        id: uid('NEG-HERO'),
        robotIds: ['R-0042', 'R-0067', 'R-0012'],
        reason: 'task-conflict',
        status: 'resolved',
        description: 'Autonomous Contract-Net negotiation: R-0042 bid highest utility based on proximity (180m) and battery (94%).',
        result: 'Contract awarded to R-0042',
        startedAt: Date.now(),
        resolvedAt: Date.now(),
        relatedTaskIds: [taskId],
      };
      this.negotiations.set(neg.id, neg);

      task.status = 'in-progress';
      task.assignedRobotId = 'R-0042';
      fault.status = 'in-response';
      fault.assignedRobotId = 'R-0042';

      r42.currentTaskId = taskId;
      r42.targetPosition = { ...sensor.location };
      r42.state = 'active';
      r42.route = [
        { x: 420, y: 220 },
        { x: 480, y: 160 },
        { ...sensor.location },
      ];

      if (this.heroDemoState) {
        this.heroDemoState.currentStep = 'robot-assigned';
        this.heroDemoState.stepNumber = 3;
        this.heroDemoState.title = 'P2P Negotiation: R-0042 Deployed';
        this.heroDemoState.description = 'Eligible farm agents evaluated costs. R-0042 won mission and dispatched to Shed 2.';
      }
      this.pushEvent('negotiation-completed', `Negotiation resolved: R-0042 assigned to mission`, 'info', ['R-0042'], taskId);
      this.notify();
    }, 5000);
    this.heroTimeoutIds.push(t3);

    // STEP 4 (9s): Spatial Conflict & Dynamic Reroute
    const t4 = setTimeout(() => {
      const conflict: ConflictEvent = {
        id: uid('CF-HERO'),
        robotIds: ['R-0042', 'R-0018'],
        position: { x: 450, y: 190 },
        status: 'rerouting',
        description: 'Shed corridor bottleneck detected. R-0042 yielded right-of-way and dynamically recalculated detour.',
        detectedAt: Date.now(),
        rerouteTriggered: true,
      };
      this.conflicts.set(conflict.id, conflict);

      r42.position = { x: 445, y: 190 };
      r42.route = [
        { x: 460, y: 240 }, // Detour bypass
        { x: 510, y: 170 },
        { ...sensor.location },
      ];

      if (this.heroDemoState) {
        this.heroDemoState.currentStep = 'conflict-reroute';
        this.heroDemoState.stepNumber = 4;
        this.heroDemoState.title = 'Spatial Conflict Avoidance & Reroute';
        this.heroDemoState.description = 'R-0042 encountered utility robot in corridor. Dynamic obstacle rerouting applied (+1.1s).';
      }
      this.pushEvent('robot-rerouted', `R-0042 rerouted around corridor bottleneck`, 'warning', ['R-0042']);
      this.notify();
    }, 9000);
    this.heroTimeoutIds.push(t4);

    // STEP 5 (13s): Robot Hardware Failure ("The robot failed.")
    const t5 = setTimeout(() => {
      r42.state = 'failed';
      r42.health = 18;
      r42.speed = 0;
      r42.route = [];

      if (this.heroDemoState) {
        this.heroDemoState.currentStep = 'robot-failure';
        this.heroDemoState.stepNumber = 5;
        this.heroDemoState.title = '⚠️ Robot Hardware Failure (R-0042 Down)';
        this.heroDemoState.description = 'R-0042 suffered critical drive motor failure at waypoint. Unit immobilized in corridor.';
      }
      this.pushAlert('critical', 'failure', 'R-0042 motor drive offline! Task at risk of abandonment');
      this.pushEvent('robot-failure', `R-0042 catastrophic failure! Autonomous failover triggered`, 'critical', ['R-0042'], taskId);
      this.notify();
    }, 13000);
    this.heroTimeoutIds.push(t5);

    // STEP 6 (15.5s): Automatic Task Migration to R-0067 ("The mission didn't.")
    const t6 = setTimeout(() => {
      const task = this.tasks.get(taskId);
      const fault = this.faults.get(faultId);
      if (!task || !fault) return;

      task.status = 'reassigned';
      task.previousRobotId = 'R-0042';
      task.assignedRobotId = 'R-0067';

      fault.assignedRobotId = 'R-0067';

      r67.currentTaskId = taskId;
      r67.targetPosition = { ...sensor.location };
      r67.state = 'active';
      r67.position = { x: 500, y: 280 };
      r67.route = [
        { x: 520, y: 190 },
        { ...sensor.location },
      ];

      if (this.heroDemoState) {
        this.heroDemoState.currentStep = 'task-migration';
        this.heroDemoState.stepNumber = 6;
        this.heroDemoState.title = '🔄 Autonomous Task Migration: R-0067 Takes Over';
        this.heroDemoState.description = 'Decentralized failover: Mission seamlessly transferred to backup agent R-0067. Zero human intervention.';
      }
      this.pushEvent(
        'task-migrated',
        `TASK MIGRATION: Mission transferred from failed R-0042 → R-0067`,
        'warning',
        ['R-0042', 'R-0067'],
        taskId
      );
      this.notify();
    }, 15500);
    this.heroTimeoutIds.push(t6);

    // STEP 7 (21s): Recovery Complete & Fault Resolved! ("The robot failed. The mission didn't.")
    const t7 = setTimeout(() => {
      const task = this.tasks.get(taskId);
      const fault = this.faults.get(faultId);

      if (task) {
        task.status = 'completed';
        task.completedAt = Date.now();
      }
      if (fault) {
        fault.status = 'resolved';
        fault.resolvedAt = Date.now();
      }

      r67.position = { ...sensor.location };
      r67.route = [];
      r67.state = 'idle';
      r67.currentTaskId = undefined;

      sensor.currentValue = 28.5;
      sensor.status = 'nominal';

      if (this.heroDemoState) {
        this.heroDemoState.currentStep = 'recovery-complete';
        this.heroDemoState.stepNumber = 7;
        this.heroDemoState.title = '🎯 Fault Resolved: "The Robot Failed. The Mission Didn\'t."';
        this.heroDemoState.description = 'R-0067 opened ventilation damper. Shed 2 temperature restored to 28.5°C. Full mission success!';
      }
      this.pushEvent(
        'fault-resolved',
        `FAULT RESOLVED: Shed 2 cooled to 28.5°C by R-0067. Mission complete!`,
        'info',
        ['R-0067'],
        taskId
      );
      this.notify();
    }, 21000);
    this.heroTimeoutIds.push(t7);
  }

  cancelHeroDemo() {
    this.clearHeroTimeouts();
    this.heroDemoState = null;
    this.notify();
  }

  private clearHeroTimeouts() {
    this.heroTimeoutIds.forEach(id => clearTimeout(id));
    this.heroTimeoutIds = [];
  }

  // --- Simulation Control ---

  start() {
    if (this.config.state === 'running') return;
    if (this.config.state === 'stopped') {
      this.initialize(this.config.robotCount);
    }
    this.config.state = 'running';
    this.startTicking();
    this.notify();
  }

  pause() {
    if (this.config.state !== 'running') return;
    this.config.state = 'paused';
    this.stopTicking();
    this.notify();
  }

  resume() {
    if (this.config.state !== 'paused') return;
    this.config.state = 'running';
    this.startTicking();
    this.notify();
  }

  reset() {
    this.stopTicking();
    this.config.state = 'stopped';
    this.initialize(this.config.robotCount);
    this.notify();
  }

  setSpeed(speed: number) {
    this.config.speed = speed;
    if (this.config.state === 'running') {
      this.stopTicking();
      this.startTicking();
    }
    this.notify();
  }

  private startTicking() {
    this.stopTicking();
    const interval = Math.max(16, Math.floor(50 / this.config.speed));
    this.tickInterval = setInterval(() => this.tick(), interval);
  }

  private stopTicking() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // --- Main Simulation Tick ---

  private tick() {
    this.tickCount++;
    const dt = 0.05 * this.config.speed;

    for (const robot of this.robots.values()) {
      this.updateRobot(robot, dt);
    }

    if (this.tickCount % 10 === 0 && (!this.heroDemoState || !this.heroDemoState.isActive)) {
      this.fluctuateSensors();
    }

    if (this.tickCount % 5 === 0) {
      this.assignPendingTasks();
    }

    if (this.tickCount % 8 === 0) {
      this.checkCollisions();
    }

    if (this.tickCount % 15 === 0) {
      this.triggerNegotiations();
    }

    if (this.tickCount % 20 === 0) {
      this.checkDeadlocks();
    }

    if (this.tickCount % 30 === 0) {
      this.resolveEvents();
    }

    if (this.tickCount % 10 === 0) {
      this.computeAnalytics();
    }

    if (this.events.length > 200) this.events = this.events.slice(-200);
    if (this.alerts.length > 150) this.alerts = this.alerts.slice(-150);

    this.notify();
  }

  private fluctuateSensors() {
    for (const s of this.sensors.values()) {
      if (s.status === 'critical') continue;
      const noise = (Math.random() - 0.5) * 0.3;
      s.currentValue = Math.round((s.currentValue + noise) * 10) / 10;
      s.lastReadingTime = Date.now();
    }
  }

  private updateRobot(robot: Robot, dt: number) {
    if (robot.state === 'active') {
      robot.battery = clamp(robot.battery - 0.02 * dt, 0, 100);
    } else if (robot.state === 'charging') {
      robot.battery = clamp(robot.battery + 0.15 * dt, 0, 100);
      if (robot.battery >= 95) {
        robot.state = 'idle';
        robot.battery = 100;
      }
      return;
    } else if (robot.state === 'failed' || robot.state === 'deadlocked') {
      if (this.heroDemoState?.isActive && robot.id === 'R-0042') return;

      if (Math.random() < 0.001 * dt) {
        robot.state = 'idle';
        robot.health = clamp(robot.health + 20, 0, 100);
        this.pushEvent('recovery-completed', `${robot.id} recovered from ${robot.state}`, 'info', [robot.id]);
      }
      return;
    }

    if (robot.battery < 15) {
      if (robot.currentTaskId) {
        this.reassignTask(robot.currentTaskId, robot.id, 'low-battery');
      }
      robot.state = 'charging';
      const station = this.nearestChargingStation(robot.position);
      robot.targetPosition = station;
      robot.route = [station];
      this.pushEvent('low-battery', `${robot.id} battery low (${Math.round(robot.battery)}%)`, 'warning', [robot.id]);
      return;
    }

    if (robot.state === 'active' && robot.route.length > 0) {
      const target = robot.route[0];
      const d = dist(robot.position, target);
      if (d < 3) {
        robot.route.shift();
        if (robot.route.length === 0 && robot.currentTaskId) {
          const task = this.tasks.get(robot.currentTaskId);
          if (task && task.status === 'in-progress') {
            task.status = 'completed';
            task.completedAt = Date.now();
            if (task.faultId) {
              const fault = this.faults.get(task.faultId);
              if (fault) {
                fault.status = 'resolved';
                fault.resolvedAt = Date.now();
              }
            }
            this.pushEvent('task-completed', `${task.name} completed by ${robot.id}`, 'info', [robot.id], task.id);
          }
          robot.currentTaskId = undefined;
          robot.targetPosition = undefined;
          robot.state = 'idle';
        }
      } else {
        const step = Math.min(robot.speed * dt, d);
        const angle = Math.atan2(target.y - robot.position.y, target.x - robot.position.x);
        robot.position.x += Math.cos(angle) * step;
        robot.position.y += Math.sin(angle) * step;
      }

      const remaining = robot.route.reduce((sum, p, i) => {
        const prev = i === 0 ? robot.position : robot.route[i - 1];
        return sum + dist(prev, p);
      }, 0);
      robot.eta = Math.round(remaining / robot.speed);
    } else if (robot.state === 'idle') {
      robot.position.x += (Math.random() - 0.5) * 0.2;
      robot.position.y += (Math.random() - 0.5) * 0.2;
      robot.position.x = clamp(robot.position.x, 10, this.map.width - 10);
      robot.position.y = clamp(robot.position.y, 10, this.map.height - 10);
    }

    robot.lastUpdated = Date.now();
  }

  private assignPendingTasks() {
    const pendingTasks = [...this.tasks.values()].filter(t => t.status === 'pending');
    const idleRobots = [...this.robots.values()].filter(r => r.state === 'idle' && r.battery > 20);

    for (const task of pendingTasks) {
      const candidates = idleRobots.filter(
        r => r.capability === task.requiredCapability || r.capability === 'general_purpose'
      );
      if (candidates.length === 0) continue;

      candidates.sort((a, b) => dist(a.position, task.location) - dist(b.position, task.location));
      const chosen = candidates[0];

      task.status = 'assigned';
      task.assignedRobotId = chosen.id;

      chosen.currentTaskId = task.id;
      chosen.targetPosition = task.location;
      chosen.state = 'active';
      chosen.route = this.generateRoute(chosen.position, task.location);

      task.status = 'in-progress';
      const idx = idleRobots.indexOf(chosen);
      if (idx >= 0) idleRobots.splice(idx, 1);
    }
  }

  private reassignTask(taskId: string, failedRobotId: string, reason: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'reassigned';
    task.previousRobotId = failedRobotId;
    task.assignedRobotId = undefined;

    const candidates = [...this.robots.values()].filter(
      r => (r.capability === task.requiredCapability || r.capability === 'general_purpose') &&
           r.state === 'idle' && r.battery > 20 && r.id !== failedRobotId
    );

    if (candidates.length > 0) {
      candidates.sort((a, b) => dist(a.position, task.location) - dist(b.position, task.location));
      const newRobot = candidates[0];

      task.assignedRobotId = newRobot.id;
      task.status = 'in-progress';
      newRobot.currentTaskId = task.id;
      newRobot.targetPosition = task.location;
      newRobot.state = 'active';
      newRobot.route = this.generateRoute(newRobot.position, task.location);

      this.pushEvent(
        'task-migrated',
        `TASK MIGRATION: ${task.id} reassigned from ${failedRobotId} → ${newRobot.id} (${reason})`,
        'warning',
        [failedRobotId, newRobot.id],
        task.id
      );
    } else {
      task.status = 'pending';
    }
  }

  private generateRoute(from: Position, to: Position): Position[] {
    const waypoints: Position[] = [];
    const steps = Math.max(2, Math.floor(dist(from, to) / 80));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      waypoints.push({
        x: clamp(from.x + (to.x - from.x) * t + rand(-25, 25), 10, this.map.width - 10),
        y: clamp(from.y + (to.y - from.y) * t + rand(-25, 25), 10, this.map.height - 10),
      });
    }
    waypoints[waypoints.length - 1] = { ...to };
    return waypoints;
  }

  private checkCollisions() {
    const activeRobots = [...this.robots.values()].filter(r => r.state === 'active');
    const COLLISION_DIST = 15;

    for (let i = 0; i < Math.min(activeRobots.length, 150); i++) {
      for (let j = i + 1; j < Math.min(activeRobots.length, 150); j++) {
        const a = activeRobots[i];
        const b = activeRobots[j];
        const d = dist(a.position, b.position);

        if (d < COLLISION_DIST) {
          const conflict: ConflictEvent = {
            id: uid('CF'),
            robotIds: [a.id, b.id],
            position: { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 },
            status: 'rerouting',
            description: `Proximity bottleneck between ${a.id} and ${b.id}`,
            detectedAt: Date.now(),
            rerouteTriggered: true,
          };
          this.conflicts.set(conflict.id, conflict);
          if (b.route.length > 0) {
            b.route = this.generateRoute(b.position, b.route[b.route.length - 1]);
          }
        }
      }
    }
  }

  private triggerNegotiations() {
    if (Math.random() > 0.3) return;
    const activeRobots = [...this.robots.values()].filter(r => r.state === 'active');
    if (activeRobots.length < 2) return;
    const a = pick(activeRobots);
    let b = pick(activeRobots);
    // Step 11: Only negotiate if within P2P radio radius (100 units)
    if (a.id === b.id || dist(a.position, b.position) > this.config.commRangeUnits) return;

    const neg: NegotiationEvent = {
      id: uid('NEG'),
      robotIds: [a.id, b.id],
      reason: pick(['right-of-way', 'resource-conflict', 'task-conflict']),
      status: 'in-progress',
      description: `${a.id} & ${b.id} negotiating right-of-way corridor intersection via P2P radio`,
      startedAt: Date.now(),
    };
    this.negotiations.set(neg.id, neg);
  }

  private checkDeadlocks() {
    if (Math.random() > 0.12) return;
    const negs = [...this.robots.values()].filter(r => r.state === 'negotiating');
    if (negs.length < 2) return;
    const ids = negs.slice(0, 2).map(r => r.id);

    const dl: DeadlockEvent = {
      id: uid('DL'),
      robotIds: ids,
      status: 'detected',
      description: `Wait-For Graph cycle detected among ${ids.join(', ')}`,
      detectedAt: Date.now(),
    };
    this.deadlocks.set(dl.id, dl);
  }

  private resolveEvents() {
    for (const neg of this.negotiations.values()) {
      if (neg.status === 'in-progress' && Date.now() - neg.startedAt > 3000 / this.config.speed) {
        neg.status = 'resolved';
        neg.resolvedAt = Date.now();
        neg.result = pick(['Priority yield', 'Speed offset agreed', 'Detour accepted']);
      }
    }
    for (const conf of this.conflicts.values()) {
      if (conf.status !== 'resolved' && Date.now() - conf.detectedAt > 4000 / this.config.speed) {
        conf.status = 'resolved';
        conf.resolvedAt = Date.now();
      }
    }
    for (const dl of this.deadlocks.values()) {
      if (dl.status !== 'resolved' && Date.now() - dl.detectedAt > 5000 / this.config.speed) {
        dl.status = 'resolved';
        dl.resolvedAt = Date.now();
        dl.recoveryAction = 'Wait-for cycle broken via priority reassignment';
      }
    }
  }

  private nearestChargingStation(pos: Position): Position {
    let nearest = this.map.chargingStations[0];
    let minDist = dist(pos, nearest);
    for (const station of this.map.chargingStations) {
      const d = dist(pos, station);
      if (d < minDist) {
        minDist = d;
        nearest = station;
      }
    }
    return { ...nearest };
  }

  private pushEvent(type: EventType, message: string, severity: AlertSeverity, robotIds?: string[], taskId?: string) {
    this.events.push({
      id: uid('E'),
      type,
      message,
      robotIds,
      taskId,
      timestamp: Date.now(),
      severity,
    });
  }

  private pushAlert(severity: AlertSeverity, category: Alert['category'], message: string, robotId?: string, taskId?: string) {
    this.alerts.push({
      id: uid('A'),
      severity,
      category,
      message,
      robotId,
      taskId,
      timestamp: Date.now(),
      resolved: false,
    });
  }

  private computeAnalytics() {
    const robots = [...this.robots.values()];
    const tasks = [...this.tasks.values()];
    const active = robots.filter(r => r.state === 'active').length;
    const idle = robots.filter(r => r.state === 'idle').length;
    const charging = robots.filter(r => r.state === 'charging').length;
    const failed = robots.filter(r => r.state === 'failed').length;
    const lowBat = robots.filter(r => r.battery < 20).length;
    const avgBat = robots.reduce((s, r) => s + r.battery, 0) / (robots.length || 1);

    const completed = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const activeTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'assigned').length;

    const tasksWithEta = tasks.filter(t => t.eta != null && t.status === 'in-progress');
    const avgEta = tasksWithEta.length > 0 ? tasksWithEta.reduce((s, t) => s + (t.eta || 0), 0) / tasksWithEta.length : 0;

    const activeFaults = [...this.faults.values()].filter(f => f.status !== 'resolved').length;
    const resolvedFaults = [...this.faults.values()].filter(f => f.status === 'resolved').length;
    const alertSensors = [...this.sensors.values()].filter(s => s.status !== 'nominal').length;

    this.analytics = {
      totalRobots: robots.length,
      activeRobots: active,
      idleRobots: idle,
      chargingRobots: charging,
      failedRobots: failed,
      lowBatteryRobots: lowBat,
      averageBattery: Math.round(avgBat),
      totalTasks: tasks.length,
      activeTasks,
      pendingTasks: pending,
      completedTasks: completed,
      failedTasks,
      totalConflicts: this.conflicts.size,
      totalDeadlocks: this.deadlocks.size,
      totalNegotiations: this.negotiations.size,
      totalRecoveries: [...this.deadlocks.values()].filter(d => d.status === 'resolved').length,
      totalReassignments: tasks.filter(t => t.previousRobotId != null).length,
      averageEta: Math.round(avgEta),
      taskSuccessRate: (completed + failedTasks) > 0 ? Math.round((completed / (completed + failedTasks)) * 100) : 100,
      robotUtilization: robots.length > 0 ? Math.round((active / robots.length) * 100) : 0,
      activeFaultsCount: activeFaults,
      resolvedFaultsCount: resolvedFaults,
      sensorsAlertCount: alertSensors,
      waterRobotsCount: robots.filter(r => r.capability === 'water_inspection').length,
      electricalRobotsCount: robots.filter(r => r.capability === 'electrical_inspection').length,
      transportRobotsCount: robots.filter(r => r.capability === 'utility_transport').length,
      emergencyRobotsCount: robots.filter(r => r.capability === 'emergency_response').length,
      relayRobotsCount: robots.filter(r => r.capability === 'communication_relay').length,
      generalRobotsCount: robots.filter(r => r.capability === 'general_purpose').length,
    };
  }

  private emptyAnalytics(): FleetAnalytics {
    return {
      totalRobots: 0, activeRobots: 0, idleRobots: 0, chargingRobots: 0, failedRobots: 0,
      lowBatteryRobots: 0, averageBattery: 0, totalTasks: 0, activeTasks: 0, pendingTasks: 0,
      completedTasks: 0, failedTasks: 0, totalConflicts: 0, totalDeadlocks: 0, totalNegotiations: 0,
      totalRecoveries: 0, totalReassignments: 0, averageEta: 0, taskSuccessRate: 100, robotUtilization: 0,
      activeFaultsCount: 0, resolvedFaultsCount: 0, sensorsAlertCount: 0,
      waterRobotsCount: 0, electricalRobotsCount: 0, transportRobotsCount: 0,
      emergencyRobotsCount: 0, relayRobotsCount: 0, generalRobotsCount: 0,
    };
  }

  getSnapshot() {
    return {
      robots: [...this.robots.values()],
      tasks: [...this.tasks.values()],
      sensors: [...this.sensors.values()],
      waterPipes: [...this.waterPipes.values()],
      faults: [...this.faults.values()],
      negotiations: [...this.negotiations.values()],
      conflicts: [...this.conflicts.values()],
      deadlocks: [...this.deadlocks.values()],
      alerts: [...this.alerts],
      events: [...this.events],
      analytics: { ...this.analytics },
      config: { ...this.config },
      map: this.map,
      heroDemoState: this.heroDemoState ? { ...this.heroDemoState } : null,
    };
  }

  private notify() {
    if (this.onUpdate) this.onUpdate();
  }

  destroy() {
    this.stopTicking();
    this.clearHeroTimeouts();
  }
}
