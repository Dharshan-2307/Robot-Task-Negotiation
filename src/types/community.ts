// ============================================================================
// URBANCOMMUNITY — Autonomous Gated Community & Apartment Multi-Robot Engine
// Isolated Domain Types: Residential Towers, Delivery, Security, Utilities
// ============================================================================

export type CommunityRobotState =
  | 'idle'
  | 'delivering'
  | 'cleaning'
  | 'patrolling'
  | 'repairing'
  | 'charging'
  | 'negotiating'
  | 'failed';

export type CommunityRobotRole =
  | 'parcel_delivery'       // Door-to-door packages & grocery delivery
  | 'sanitation_sweeper'    // Central courtyard & corridor cleaning
  | 'security_patrol'       // Perimeter & fire lane surveillance
  | 'plumbing_maintenance'  // Basement water sump & pipe bursts
  | 'electrical_repair'     // Substation, EV chargers & solar arrays
  | 'elevator_liaison';     // Vertical transit & automated beacon transit

export interface CommunityPosition {
  x: number;
  y: number;
}

export interface CommunityRobot {
  id: string;
  name: string;
  role: CommunityRobotRole;
  state: CommunityRobotState;
  position: CommunityPosition;
  targetPosition?: CommunityPosition;
  route: CommunityPosition[];
  battery: number; // 0-100
  health: number; // 0-100
  currentTicketId?: string;
  assignedZone: string;
  speed: number;
  eta?: number;
  alerts: string[];
}

export type CommunityBuildingType =
  | 'tower'
  | 'clubhouse'
  | 'security_gate'
  | 'parking_ev'
  | 'waste_hub'
  | 'utility_pumps'
  | 'central_park';

export interface CommunityBuilding {
  id: string;
  label: string;
  type: CommunityBuildingType;
  x: number;
  y: number;
  w: number;
  h: number;
  floors?: number;
  status: 'nominal' | 'issue' | 'emergency';
  details: string;
}

export type IssueCategory =
  | 'package_delivery'
  | 'water_pipe_leak'
  | 'smart_bin_overflow'
  | 'ev_charger_fault'
  | 'fire_lane_blocked'
  | 'elevator_maintenance'
  | 'night_patrol_anomaly';

export interface CommunityIssue {
  id: string;
  title: string;
  category: IssueCategory;
  locationName: string;
  location: CommunityPosition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved';
  requiredRole: CommunityRobotRole;
  assignedRobotId?: string;
  createdAt: number;
  resolvedAt?: number;
  description: string;
}

export interface CommunityEvent {
  id: string;
  timestamp: number;
  type: 'delivery' | 'maintenance' | 'security' | 'negotiation' | 'alert';
  message: string;
  robotId?: string;
  issueId?: string;
  locationName?: string;
}
