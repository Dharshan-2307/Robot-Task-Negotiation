// ============================================================================
// SHEET & EXCEL IMPORTER — Multi-format parser for Excel (.xlsx/.xls), CSV & Google Sheets
// ============================================================================

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Robot, Task, RobotCapability, TaskPriority, RobotState, TaskStatus } from '@/types';
import { useFleetStore } from '@/store/useFleetStore';

export interface ImportResult {
  robots: Robot[];
  tasks: Task[];
  summary: {
    robotsCount: number;
    tasksCount: number;
    detectedSheets: string[];
  };
  errors: string[];
}

// Normalize key names for flexible column matching
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findValue(row: Record<string, any>, candidates: string[]): any {
  for (const c of candidates) {
    const norm = normalizeKey(c);
    for (const k of Object.keys(row)) {
      if (normalizeKey(k) === norm) {
        return row[k];
      }
    }
  }
  return undefined;
}

// Convert arbitrary sheet rows to Robot objects
export function parseRobotsFromRows(rows: Record<string, any>[]): Robot[] {
  const robots: Robot[] = [];

  rows.forEach((row, idx) => {
    const rawId = findValue(row, ['robot_id', 'robotid', 'id', 'robot', 'name', 'unit']);
    const id = rawId ? String(rawId).trim() : `R-${String(idx + 1).padStart(4, '0')}`;

    const xVal = findValue(row, ['x', 'pos_x', 'initial_x', 'position_x', 'coord_x']);
    const yVal = findValue(row, ['y', 'pos_y', 'initial_y', 'position_y', 'coord_y']);
    const x = typeof xVal === 'number' ? xVal : (parseFloat(xVal) || Math.random() * 1100 + 50);
    const y = typeof yVal === 'number' ? yVal : (parseFloat(yVal) || Math.random() * 700 + 50);

    const capVal = findValue(row, ['capability', 'cap', 'type', 'role', 'specialization']);
    const validCaps: RobotCapability[] = ['transport', 'assembly', 'inspection', 'welding', 'painting', 'cleaning', 'heavy-lift', 'precision'];
    let capability: RobotCapability = 'transport';
    if (capVal && validCaps.includes(String(capVal).toLowerCase() as RobotCapability)) {
      capability = String(capVal).toLowerCase() as RobotCapability;
    }

    const batVal = findValue(row, ['battery', 'battery_level', 'charge', 'bat']);
    const battery = typeof batVal === 'number' ? batVal : (parseFloat(batVal) || Math.floor(Math.random() * 60 + 40));

    const spdVal = findValue(row, ['speed', 'max_speed', 'velocity']);
    const speed = typeof spdVal === 'number' ? spdVal : (parseFloat(spdVal) || 2.5);

    const stateVal = findValue(row, ['state', 'status']);
    let state: RobotState = 'idle';
    if (stateVal && ['active', 'idle', 'charging', 'failed'].includes(String(stateVal).toLowerCase())) {
      state = String(stateVal).toLowerCase() as RobotState;
    }

    robots.push({
      id,
      name: `Robot ${id}`,
      position: { x, y },
      state,
      battery: Math.min(100, Math.max(0, battery)),
      health: 100,
      capability,
      route: [],
      speed,
      alerts: [],
      lastUpdated: Date.now(),
      commRadius: 100,
      isMeshRelay: false,
    });
  });

  return robots;
}

// Convert arbitrary sheet rows to Task objects
export function parseTasksFromRows(rows: Record<string, any>[]): Task[] {
  const tasks: Task[] = [];

  rows.forEach((row, idx) => {
    const rawId = findValue(row, ['task_id', 'taskid', 'id', 'task']);
    const id = rawId ? String(rawId).trim() : `T-${String(idx + 1).padStart(4, '0')}`;

    const nameVal = findValue(row, ['name', 'task_name', 'title', 'description']);
    const name = nameVal ? String(nameVal).trim() : `Task ${id}`;

    const xVal = findValue(row, ['x', 'target_x', 'location_x', 'dest_x']);
    const yVal = findValue(row, ['y', 'target_y', 'location_y', 'dest_y']);
    const x = typeof xVal === 'number' ? xVal : (parseFloat(xVal) || Math.random() * 1100 + 50);
    const y = typeof yVal === 'number' ? yVal : (parseFloat(yVal) || Math.random() * 700 + 50);

    const capVal = findValue(row, ['capability', 'required_capability', 'type']);
    const validCaps: RobotCapability[] = ['transport', 'assembly', 'inspection', 'welding', 'painting', 'cleaning', 'heavy-lift', 'precision'];
    let requiredCapability: RobotCapability = 'transport';
    if (capVal && validCaps.includes(String(capVal).toLowerCase() as RobotCapability)) {
      requiredCapability = String(capVal).toLowerCase() as RobotCapability;
    }

    const prioVal = findValue(row, ['priority', 'urgency']);
    const validPrios: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
    let priority: TaskPriority = 'medium';
    if (prioVal && validPrios.includes(String(prioVal).toLowerCase() as TaskPriority)) {
      priority = String(prioVal).toLowerCase() as TaskPriority;
    }

    const assignedRobotVal = findValue(row, ['assigned_robot', 'robot_id', 'robot', 'assigned_to']);
    const assignedRobotId = assignedRobotVal ? String(assignedRobotVal).trim() : undefined;

    tasks.push({
      id,
      name,
      priority,
      requiredCapability,
      location: { x, y },
      assignedRobotId,
      status: assignedRobotId ? 'in-progress' : 'pending',
      createdAt: Date.now(),
      description: `Task ${name} (${requiredCapability})`,
    });
  });

  return tasks;
}

// Parse an uploaded Excel or CSV file buffer
export function parseExcelOrCsv(buffer: ArrayBuffer | string, fileName: string): ImportResult {
  const errors: string[] = [];
  let robots: Robot[] = [];
  let tasks: Task[] = [];
  let detectedSheets: string[] = [];

  try {
    if (fileName.endsWith('.csv') && typeof buffer === 'string') {
      const parsed = Papa.parse<Record<string, any>>(buffer, { header: true, skipEmptyLines: true });
      const rows = parsed.data;

      // Determine if file represents robots, tasks, or combined
      const isTaskSheet = rows.some(r => findValue(r, ['task_id', 'taskid', 'required_capability', 'priority']) !== undefined);
      if (isTaskSheet) {
        tasks = parseTasksFromRows(rows);
      } else {
        robots = parseRobotsFromRows(rows);
      }
      detectedSheets = [fileName];
    } else {
      // Use XLSX parser for .xlsx, .xls, or binary CSV
      const workbook = XLSX.read(buffer, { type: typeof buffer === 'string' ? 'binary' : 'array' });
      detectedSheets = workbook.SheetNames;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        if (rows.length === 0) continue;

        const lower = sheetName.toLowerCase();
        if (lower.includes('robot') || lower.includes('fleet') || lower.includes('agent')) {
          robots = parseRobotsFromRows(rows);
        } else if (lower.includes('task') || lower.includes('order') || lower.includes('job') || lower.includes('mission')) {
          tasks = parseTasksFromRows(rows);
        } else {
          // Auto-detect based on row fields
          const hasTaskFields = rows.some(r => findValue(r, ['task_id', 'taskid', 'priority']) !== undefined);
          const hasRobotFields = rows.some(r => findValue(r, ['robot_id', 'robotid', 'battery', 'charge']) !== undefined);

          if (hasTaskFields && tasks.length === 0) {
            tasks = parseTasksFromRows(rows);
          } else if (hasRobotFields && robots.length === 0) {
            robots = parseRobotsFromRows(rows);
          } else if (robots.length === 0) {
            robots = parseRobotsFromRows(rows);
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`Failed to parse file: ${err.message || String(err)}`);
  }

  return {
    robots,
    tasks,
    summary: {
      robotsCount: robots.length,
      tasksCount: tasks.length,
      detectedSheets,
    },
    errors,
  };
}

// Fetch and parse from a Google Sheets URL
export async function parseGoogleSheetUrl(url: string): Promise<ImportResult> {
  const errors: string[] = [];

  try {
    // Match Google Sheet ID from URL
    // Format: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL. Please provide a standard Google Sheets sharing link.');
    }

    const sheetId = match[1];

    // Extract gid if present
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    const res = await fetch(csvExportUrl);
    if (!res.ok) {
      throw new Error(`Could not access Google Sheet. Please make sure the sheet sharing is set to "Anyone with the link can view". (HTTP ${res.status})`);
    }

    const csvText = await res.text();
    return parseExcelOrCsv(csvText, 'google_sheet.csv');
  } catch (err: any) {
    errors.push(err.message || 'Error syncing Google Sheet');
    return {
      robots: [],
      tasks: [],
      summary: { robotsCount: 0, tasksCount: 0, detectedSheets: [] },
      errors,
    };
  }
}

// Apply imported fleet and tasks directly into the active Zustand store & simulation
export function applyImportedData(result: ImportResult) {
  const store = useFleetStore.getState();

  if (result.robots.length > 0) {
    store.robots = result.robots;
    if (store.engine) {
      store.engine.robots.clear();
      result.robots.forEach(r => store.engine?.robots.set(r.id, r));
      store.engine.config.robotCount = result.robots.length;
    }
  }

  if (result.tasks.length > 0) {
    store.tasks = result.tasks;
    if (store.engine) {
      store.engine.tasks.clear();
      result.tasks.forEach(t => store.engine?.tasks.set(t.id, t));
    }
  }

  store.syncFromEngine();
}
