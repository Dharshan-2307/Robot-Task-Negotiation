// ============================================================================
// ZUSTAND STORE — Global State Management with Atomic Subscriptions
// ============================================================================

import { create } from 'zustand';
import {
  Robot, Task, NegotiationEvent, ConflictEvent, DeadlockEvent,
  Alert, LiveEvent, FleetAnalytics, SimulationConfig, MapConfig,
  ConnectionStatus, SensorUnit, FaultIncident, HeroDemoState, WaterPipeSection,
  IoTTelemetryRow
} from '@/types';
import { SimulationEngine } from '@/engine/SimulationEngine';
import { DEFAULT_IOT_TELEMETRY } from '@/data/defaultTelemetry';

interface FleetStore {
  // --- Connection ---
  connectionStatus: ConnectionStatus;

  // --- Core Data ---
  robots: Robot[];
  tasks: Task[];
  sensors: SensorUnit[];
  waterPipes: WaterPipeSection[];
  faults: FaultIncident[];
  negotiations: NegotiationEvent[];
  conflicts: ConflictEvent[];
  deadlocks: DeadlockEvent[];
  alerts: Alert[];
  events: LiveEvent[];
  analytics: FleetAnalytics;
  simulationConfig: SimulationConfig;
  map: MapConfig;
  heroDemoState: HeroDemoState | null;
  isControllerOnline: boolean;

  // --- IoT Telemetry Logs ---
  telemetryLogs: IoTTelemetryRow[];
  activeTelemetryIndex: number;

  // --- UI State ---
  selectedRobotId: string | null;
  selectedTaskId: string | null;
  selectedSensorId: string | null;
  activeTab: string;
  eventFilter: string | null;
  alertFilter: string | null;

  // --- Engine ---
  engine: SimulationEngine | null;

  // --- Actions ---
  initializeSimulation: (robotCount?: number) => void;
  setRobotCount: (robotCount: number) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  injectFailure: () => void;
  injectConflict: () => void;
  injectDeadlock: () => void;
  triggerSensorFault: (sensorId: string) => void;
  runHeroDemo: () => void;
  cancelHeroDemo: () => void;

  // Step 24 Jury & Step 20 Showstopper Controls
  toggleControllerOnline: () => void;
  createWaterFault: () => void;
  createElectricalFault: () => void;
  failRandomRobot: () => void;
  failWaterPipe: (pipeId: string) => void;
  triggerCommLossZone: (zone?: string) => void;
  triggerLowBatteryEvent: () => void;

  // IoT Telemetry Step & Load
  loadTelemetryLogs: (logs: IoTTelemetryRow[]) => void;
  stepTelemetryLog: (index: number) => void;

  selectRobot: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  selectSensor: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setEventFilter: (filter: string | null) => void;
  setAlertFilter: (filter: string | null) => void;

  syncFromEngine: () => void;
}

const emptyAnalytics: FleetAnalytics = {
  totalRobots: 0, activeRobots: 0, idleRobots: 0, chargingRobots: 0, failedRobots: 0,
  lowBatteryRobots: 0, averageBattery: 0, totalTasks: 0, activeTasks: 0, pendingTasks: 0,
  completedTasks: 0, failedTasks: 0, totalConflicts: 0, totalDeadlocks: 0, totalNegotiations: 0,
  totalRecoveries: 0, totalReassignments: 0, averageEta: 0, taskSuccessRate: 100, robotUtilization: 0,
  activeFaultsCount: 0, resolvedFaultsCount: 0, sensorsAlertCount: 0,
  waterRobotsCount: 0, electricalRobotsCount: 0, transportRobotsCount: 0,
  emergencyRobotsCount: 0, relayRobotsCount: 0, generalRobotsCount: 0,
};

const getStoredRobotCount = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const saved = parseInt(localStorage.getItem('agriswarm_robot_count') || '', 10);
      if (!isNaN(saved) && saved >= 1 && saved <= 1000) {
        return saved;
      }
    } catch {
      // ignore
    }
  }
  return 10;
};

export const useFleetStore = create<FleetStore>((set, get) => ({
  connectionStatus: 'simulated',

  robots: [],
  tasks: [],
  sensors: [],
  waterPipes: [],
  faults: [],
  negotiations: [],
  conflicts: [],
  deadlocks: [],
  alerts: [],
  events: [],
  analytics: emptyAnalytics,
  simulationConfig: { state: 'stopped', speed: 1, robotCount: 10, taskGenerationRate: 10, isControllerOnline: true, commRangeUnits: 100 },
  map: { width: 1200, height: 800, gridSize: 40, obstacles: [], chargingStations: [], taskStations: [], sensors: [], waterPipes: [] },
  heroDemoState: null,
  isControllerOnline: true,

  // --- IoT Telemetry Logs (Preloaded from Google Sheets by Default) ---
  telemetryLogs: DEFAULT_IOT_TELEMETRY,
  activeTelemetryIndex: 0,

  selectedRobotId: null,
  selectedTaskId: null,
  selectedSensorId: null,
  activeTab: 'dashboard',
  eventFilter: null,
  alertFilter: null,

  engine: null,

  initializeSimulation: (robotCount?: number) => {
    const existingEngine = get().engine;
    if (existingEngine) existingEngine.destroy();

    const effectiveCount = robotCount !== undefined && robotCount >= 1
      ? robotCount
      : getStoredRobotCount();

    const engine = new SimulationEngine(() => {
      get().syncFromEngine();
    });
    engine.config.robotCount = effectiveCount;
    engine.initialize(effectiveCount);

    set({ engine, connectionStatus: 'simulated' });
    get().syncFromEngine();
    get().stepTelemetryLog(0);
  },

  setRobotCount: (robotCount: number) => {
    const validCount = Math.max(1, Math.min(1000, Math.floor(robotCount)));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('agriswarm_robot_count', String(validCount));
      } catch {
        // ignore
      }
    }
    const { engine } = get();
    if (engine) {
      engine.setRobotCount(validCount);
      get().syncFromEngine();
    } else {
      get().initializeSimulation(validCount);
    }
  },

  startSimulation: () => {
    const { engine } = get();
    if (!engine) {
      get().initializeSimulation();
      get().engine?.start();
    } else {
      engine.start();
    }
  },

  pauseSimulation: () => {
    get().engine?.pause();
  },

  resumeSimulation: () => {
    get().engine?.resume();
  },

  resetSimulation: () => {
    get().engine?.reset();
  },

  setSimulationSpeed: (speed: number) => {
    get().engine?.setSpeed(speed);
  },

  injectFailure: () => {
    get().engine?.injectFailure();
  },

  injectConflict: () => {
    get().engine?.injectConflict();
  },

  injectDeadlock: () => {
    get().engine?.injectDeadlock();
  },

  triggerSensorFault: (sensorId: string) => {
    get().engine?.triggerSensorFault(sensorId);
  },

  runHeroDemo: () => {
    get().engine?.runHeroDemo();
  },

  cancelHeroDemo: () => {
    get().engine?.cancelHeroDemo();
  },

  toggleControllerOnline: () => {
    get().engine?.toggleControllerOnline();
  },

  createWaterFault: () => {
    get().engine?.createWaterFault();
  },

  createElectricalFault: () => {
    get().engine?.createElectricalFault();
  },

  failRandomRobot: () => {
    get().engine?.failRandomRobot();
  },

  failWaterPipe: (pipeId: string) => {
    get().engine?.failWaterPipe(pipeId);
  },

  triggerCommLossZone: (zone?: string) => {
    get().engine?.triggerCommLossZone(zone);
  },

  triggerLowBatteryEvent: () => {
    get().engine?.triggerLowBatteryEvent();
  },

  loadTelemetryLogs: (logs: IoTTelemetryRow[]) => {
    set({ telemetryLogs: logs, activeTelemetryIndex: 0 });
    get().stepTelemetryLog(0);
  },

  stepTelemetryLog: (index: number) => {
    const { telemetryLogs, engine } = get();
    if (!telemetryLogs || telemetryLogs.length === 0) return;
    const boundedIndex = Math.max(0, Math.min(telemetryLogs.length - 1, index));
    const log = telemetryLogs[boundedIndex];
    set({ activeTelemetryIndex: boundedIndex });

    if (engine) {
      // 1. Update W1209 temperature sensors
      const tempSensors = Array.from(engine.sensors.values()).filter(s => s.type === 'W1209-temp');
      tempSensors.forEach(s => {
        s.currentValue = log.avgTem || log.tem1;
        s.status = s.currentValue > 35 ? 'critical' : s.currentValue > 30 ? 'warning' : 'nominal';
        s.lastReadingTime = Date.now();
      });

      // 2. Handle Water & Pipe States
      if (log.status === 'PIPE_DAMAGE') {
        engine.failWaterPipe('PIPE-09');
      } else if (log.status === 'PIPE2_ERROR') {
        engine.failWaterPipe('PIPE-04');
      } else if (log.status === 'PIPE_NORMAL' || log.status === 'NORMAL') {
        for (const pipe of engine.waterPipes.values()) {
          pipe.status = 'normal';
          pipe.flowRate = 42.0;
          pipe.pressure = 2.4;
        }
      }

      get().syncFromEngine();
    }
  },

  selectRobot: (id) => set({ selectedRobotId: id }),
  selectTask: (id) => set({ selectedTaskId: id }),
  selectSensor: (id) => set({ selectedSensorId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setEventFilter: (filter) => set({ eventFilter: filter }),
  setAlertFilter: (filter) => set({ alertFilter: filter }),

  syncFromEngine: () => {
    const { engine } = get();
    if (!engine) return;
    const snap = engine.getSnapshot();
    set({
      robots: snap.robots,
      tasks: snap.tasks,
      sensors: snap.sensors,
      waterPipes: snap.waterPipes || [],
      faults: snap.faults,
      negotiations: snap.negotiations,
      conflicts: snap.conflicts,
      deadlocks: snap.deadlocks,
      alerts: snap.alerts,
      events: snap.events,
      analytics: snap.analytics,
      simulationConfig: snap.config,
      map: snap.map,
      heroDemoState: snap.heroDemoState,
      isControllerOnline: snap.config.isControllerOnline ?? true,
    });
  },
}));
