// ============================================================================
// USE COMMUNITY STORE — Autonomous Multi-Robot Engine for Gated Community
// Completely Isolated State: Zero interference with Farm AgriSwarm Store
// ============================================================================

import { create } from 'zustand';
import {
  CommunityRobot,
  CommunityBuilding,
  CommunityIssue,
  CommunityEvent,
  CommunityPosition,
  CommunityRobotRole,
  IssueCategory,
} from '@/types/community';

// Default Apartment Complex Layout (World Coordinates: 0 to 1200 x 0 to 800)
export const COMMUNITY_BUILDINGS: CommunityBuilding[] = [
  {
    id: 'tower-a',
    label: 'TOWER A (ORCHID)',
    type: 'tower',
    x: 80,
    y: 80,
    w: 200,
    h: 160,
    floors: 18,
    status: 'nominal',
    details: '72 Residential Units • Dual High-Speed Lifts',
  },
  {
    id: 'tower-b',
    label: 'TOWER B (TULIP)',
    type: 'tower',
    x: 340,
    y: 80,
    w: 200,
    h: 160,
    floors: 18,
    status: 'nominal',
    details: '72 Residential Units • Rooftop Solar Array',
  },
  {
    id: 'tower-c',
    label: 'TOWER C (LOTUS)',
    type: 'tower',
    x: 80,
    y: 320,
    w: 200,
    h: 160,
    floors: 18,
    status: 'nominal',
    details: '72 Residential Units • Basement 2 Storage Access',
  },
  {
    id: 'tower-d',
    label: 'TOWER D (JASMINE)',
    type: 'tower',
    x: 340,
    y: 320,
    w: 200,
    h: 160,
    floors: 18,
    status: 'nominal',
    details: '72 Residential Units • Fire Escape Corridor',
  },
  {
    id: 'clubhouse',
    label: 'COMMUNITY CLUBHOUSE & GYM',
    type: 'clubhouse',
    x: 620,
    y: 80,
    w: 240,
    h: 160,
    floors: 3,
    status: 'nominal',
    details: 'Banquet Hall, Infinity Pool & Coworking Lounge',
  },
  {
    id: 'parking-ev',
    label: 'PARKING & EV SUPERCHARGERS',
    type: 'parking_ev',
    x: 620,
    y: 320,
    w: 240,
    h: 160,
    status: 'nominal',
    details: '12 DC Fast Chargers (22kW) & 180 Resident Bays',
  },
  {
    id: 'main-gate',
    label: 'MAIN SECURITY GATE & HUB',
    type: 'security_gate',
    x: 930,
    y: 80,
    w: 200,
    h: 160,
    status: 'nominal',
    details: 'Automated ANPR Boom Barriers & Courier Drop-Box Hub',
  },
  {
    id: 'pump-house',
    label: 'HYDRO-PUMP & DG UTILITY',
    type: 'utility_pumps',
    x: 930,
    y: 320,
    w: 200,
    h: 160,
    status: 'nominal',
    details: '3x 50HP Hydro-Pneumatic Sump Pumps & 500kVA DG',
  },
  {
    id: 'central-park',
    label: 'CENTRAL COURTYARD & LAWN',
    type: 'central_park',
    x: 80,
    y: 540,
    w: 780,
    h: 180,
    status: 'nominal',
    details: 'Walking Track, Children Play Area & Open Amphitheater',
  },
  {
    id: 'waste-center',
    label: 'SMART RECYCLING & WASTE HUB',
    type: 'waste_hub',
    x: 930,
    y: 540,
    w: 200,
    h: 180,
    status: 'nominal',
    details: 'Automated Compactor & Segregated Organic Composting',
  },
];

// Initial Service Robots (1 default autonomous multi-service unit for gated community)
const INITIAL_COMMUNITY_ROBOTS: CommunityRobot[] = [
  {
    id: 'UNIT-01',
    name: 'OmniBot Pioneer',
    role: 'parcel_delivery',
    state: 'idle',
    position: { x: 910, y: 150 },
    route: [],
    battery: 98,
    health: 100,
    assignedZone: 'Main Gate Hub & Precinct',
    speed: 3.2,
    alerts: [],
  },
];

// Initial Issues / Resident Tickets
const INITIAL_COMMUNITY_ISSUES: CommunityIssue[] = [
  {
    id: 'TKT-101',
    title: 'Pharmacy Parcel Door Delivery',
    category: 'package_delivery',
    locationName: 'Tower B, Apt 902',
    location: { x: 440, y: 160 },
    severity: 'medium',
    status: 'pending',
    requiredRole: 'parcel_delivery',
    createdAt: 1727280000000,
    description: 'Urgent prescription medicine dropped by courier at Gate 1.',
  },
];

interface CommunityStore {
  // State
  robots: CommunityRobot[];
  buildings: CommunityBuilding[];
  issues: CommunityIssue[];
  events: CommunityEvent[];
  selectedRobotId: string | null;
  selectedBuildingId: string | null;
  activeView: 'map' | 'tickets' | 'facility' | 'fleet';
  isSimRunning: boolean;
  simSpeed: number;

  // Actions
  setActiveView: (view: 'map' | 'tickets' | 'facility' | 'fleet') => void;
  selectRobot: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  toggleSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  triggerCommunityIssue: (category: IssueCategory) => void;
  resolveIssue: (issueId: string) => void;
  failCommunityRobot: (robotId: string) => void;
  recoverCommunityRobot: (robotId: string) => void;
  tickSimulation: () => void;
}

export const useCommunityStore = create<CommunityStore>((set, get) => {
  let simTimer: any = null;

  // Auto-start simulation loop for the gated community only in browser runtime
  const startLoop = () => {
    if (typeof window === 'undefined') return;
    if (simTimer) clearInterval(simTimer);
    simTimer = setInterval(() => {
      if (get().isSimRunning) {
        get().tickSimulation();
      }
    }, 100);
  };

  if (typeof window !== 'undefined') {
    startLoop();
  }

  return {
    robots: INITIAL_COMMUNITY_ROBOTS,
    buildings: COMMUNITY_BUILDINGS,
    issues: INITIAL_COMMUNITY_ISSUES,
    events: [
      {
        id: 'evt-1',
        timestamp: 1727280000000,
        type: 'delivery',
        message: 'DELIV-01 picked up medical parcel from Main Gate Hub for Tower B-902.',
        robotId: 'DELIV-01',
      },
      {
        id: 'evt-2',
        timestamp: 1727279880000,
        type: 'maintenance',
        message: 'PLUMB-01 deployed to Pump House for acoustic flange inspection.',
        robotId: 'PLUMB-01',
      },
    ],
    selectedRobotId: null,
    selectedBuildingId: null,
    activeView: 'map',
    isSimRunning: true,
    simSpeed: 1,

    setActiveView: (view) => set({ activeView: view }),
    selectRobot: (id) => set({ selectedRobotId: id }),
    selectBuilding: (id) => set({ selectedBuildingId: id }),

    toggleSimulation: () => set(s => ({ isSimRunning: !s.isSimRunning })),
    setSimSpeed: (speed) => set({ simSpeed: speed }),

    // Trigger an apartment complex incident
    triggerCommunityIssue: (category) => {
      const id = `TKT-${Math.floor(200 + Math.random() * 800)}`;
      let title = '';
      let locationName = '';
      let location: CommunityPosition = { x: 500, y: 500 };
      let role: CommunityRobotRole = 'parcel_delivery';
      let desc = '';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      switch (category) {
        case 'package_delivery':
          title = 'Grocery & Cold Pack Delivery';
          locationName = 'Tower A, Apt 1403';
          location = { x: 180, y: 160 };
          role = 'parcel_delivery';
          desc = 'Perishable groceries received at Courier Bay. Fast-track delivery assigned.';
          severity = 'medium';
          break;
        case 'water_pipe_leak':
          title = 'Basement Water Seepage Detected';
          locationName = 'Basement 1, near Tower C';
          location = { x: 180, y: 400 };
          role = 'plumbing_maintenance';
          desc = 'Flowmeter threshold tripped: 14 L/min unexpected drainage detected.';
          severity = 'high';
          break;
        case 'smart_bin_overflow':
          title = 'Courtyard Bin Level 98%';
          locationName = 'Central Park West Plaza';
          location = { x: 280, y: 620 };
          role = 'sanitation_sweeper';
          desc = 'Automated sanitation request dispatched to nearest sweeper.';
          severity = 'medium';
          break;
        case 'ev_charger_fault':
          title = 'EV Bay #7 Inverter Ground Fault';
          locationName = 'EV Supercharger Plaza';
          location = { x: 740, y: 400 };
          role = 'electrical_repair';
          desc = 'Safety isolation tripped. Auto-diagnostics required before re-energizing.';
          severity = 'high';
          break;
        case 'fire_lane_blocked':
          title = 'Emergency Corridor Blocked';
          locationName = 'Perimeter Road near Tower D';
          location = { x: 440, y: 400 };
          role = 'security_patrol';
          desc = 'AI camera detected delivery van parked over fire hydrant line.';
          severity = 'critical';
          break;
        default:
          title = 'Routine Facility Audit';
          locationName = 'Clubhouse Lounge';
          location = { x: 740, y: 160 };
          role = 'security_patrol';
          desc = 'Automated night inspection round.';
          severity = 'low';
      }

      const newIssue: CommunityIssue = {
        id,
        title,
        category,
        locationName,
        location,
        severity,
        status: 'pending',
        requiredRole: role,
        createdAt: Date.now(),
        description: desc,
      };

      // Contract-Net style P2P matching: find closest idle bot with matching capability, or fallback to the active community bot
      const eligibleBots = get().robots.filter(r => r.role === role && r.state !== 'failed');
      const chosenBot = eligibleBots.find(r => r.state === 'idle') 
        || eligibleBots[0] 
        || get().robots.find(r => r.state !== 'failed');

      if (chosenBot) {
        newIssue.assignedRobotId = chosenBot.id;
        newIssue.status = 'in_progress';
      }

      set(s => ({
        issues: [newIssue, ...s.issues.slice(0, 25)],
        events: [
          {
            id: `evt-${Date.now()}`,
            timestamp: Date.now(),
            type: category === 'package_delivery' ? 'delivery' : 'alert',
            message: `${newIssue.title} logged at ${newIssue.locationName}. Assigned: ${chosenBot?.id || 'Negotiating...'}`,
            robotId: chosenBot?.id,
            issueId: id,
            locationName,
          },
          ...s.events.slice(0, 40),
        ],
        robots: s.robots.map(r => {
          if (chosenBot && r.id === chosenBot.id) {
            return {
              ...r,
              role: role,
              state: role === 'parcel_delivery' ? 'delivering' : role === 'sanitation_sweeper' ? 'cleaning' : role === 'security_patrol' ? 'patrolling' : 'repairing',
              currentTicketId: id,
              targetPosition: location,
              route: [location],
              eta: 15,
            };
          }
          return r;
        }),
      }));
    },

    resolveIssue: (issueId) => {
      set(s => ({
        issues: s.issues.map(i => i.id === issueId ? { ...i, status: 'resolved', resolvedAt: Date.now() } : i),
        events: [
          {
            id: `evt-${Date.now()}`,
            timestamp: Date.now(),
            type: 'maintenance',
            message: `Ticket ${issueId} successfully resolved and verified on-site.`,
            issueId,
          },
          ...s.events.slice(0, 40),
        ],
      }));
    },

    // Simulate robot failure (tests decentralized failover)
    failCommunityRobot: (robotId) => {
      const robot = get().robots.find(r => r.id === robotId);
      if (!robot) return;

      const orphanTicketId = robot.currentTicketId;

      set(s => ({
        robots: s.robots.map(r => r.id === robotId ? {
          ...r,
          state: 'failed',
          health: 12,
          alerts: ['Motor driver thermal shutdown', 'Failover triggered'],
        } : r),
        events: [
          {
            id: `evt-${Date.now()}`,
            timestamp: Date.now(),
            type: 'alert',
            message: `CRITICAL: ${robotId} suffered hardware immobilization! Contract-Net re-negotiating ticket...`,
            robotId,
          },
          ...s.events.slice(0, 40),
        ],
      }));

      // Reassign task if it was carrying one
      if (orphanTicketId) {
        setTimeout(() => {
          const orphanIssue = get().issues.find(i => i.id === orphanTicketId);
          if (!orphanIssue) return;

          const backup = get().robots.find(r => r.role === orphanIssue.requiredRole && r.id !== robotId && r.state !== 'failed');
          if (backup) {
            set(s => ({
              issues: s.issues.map(i => i.id === orphanTicketId ? { ...i, assignedRobotId: backup.id } : i),
              robots: s.robots.map(r => r.id === backup.id ? {
                ...r,
                state: orphanIssue.requiredRole === 'parcel_delivery' ? 'delivering' : 'repairing',
                currentTicketId: orphanTicketId,
                targetPosition: orphanIssue.location,
                route: [orphanIssue.location],
                eta: 20,
              } : r),
              events: [
                {
                  id: `evt-${Date.now()}`,
                  timestamp: Date.now(),
                  type: 'negotiation',
                  message: `Task ${orphanTicketId} seamlessly transferred to backup agent ${backup.id}. Zero resident downtime.`,
                  robotId: backup.id,
                  issueId: orphanTicketId,
                },
                ...s.events.slice(0, 40),
              ],
            }));
          }
        }, 1200);
      }
    },

    recoverCommunityRobot: (robotId) => {
      set(s => ({
        robots: s.robots.map(r => r.id === robotId ? {
          ...r,
          state: 'idle',
          health: 100,
          battery: 98,
          alerts: [],
          targetPosition: undefined,
          route: [],
        } : r),
        events: [
          {
            id: `evt-${Date.now()}`,
            timestamp: Date.now(),
            type: 'maintenance',
            message: `${robotId} diagnostics clear. Unit returned to autonomous service pool.`,
            robotId,
          },
          ...s.events.slice(0, 40),
        ],
      }));
    },

    // Autonomous tick step (moves robots along routes and resolves completed tasks)
    tickSimulation: () => {
      const state = get();
      const speedMult = state.simSpeed;

      set(s => ({
        robots: s.robots.map(robot => {
          if (robot.state === 'failed' || robot.state === 'charging' || !robot.targetPosition) {
            return robot;
          }

          const dx = robot.targetPosition.x - robot.position.x;
          const dy = robot.targetPosition.y - robot.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const step = (robot.speed * 1.5 * speedMult);

          if (dist <= step) {
            // Reached destination!
            const completedTicketId = robot.currentTicketId;

            // If it had a ticket, resolve it
            if (completedTicketId) {
              setTimeout(() => {
                get().resolveIssue(completedTicketId);
              }, 400);
            }

            return {
              ...robot,
              position: { ...robot.targetPosition },
              targetPosition: undefined,
              route: [],
              eta: 0,
              state: 'idle',
              currentTicketId: undefined,
              battery: Math.max(15, robot.battery - 0.4),
            };
          } else {
            // Move toward target
            const angle = Math.atan2(dy, dx);
            return {
              ...robot,
              position: {
                x: robot.position.x + Math.cos(angle) * step,
                y: robot.position.y + Math.sin(angle) * step,
              },
              eta: Math.max(1, Math.round(dist / (robot.speed * 2))),
              battery: Math.max(15, robot.battery - 0.02),
            };
          }
        }),
      }));
    },
  };
});
