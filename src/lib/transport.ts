// ============================================================================
// DUAL-MODE TRANSPORT LAYER with BULLETPROOF FAILOVER WATCHDOG
// Attempts live backend; instantly falls back to simulation on error/timeout/disconnect
// ============================================================================

import { useFleetStore } from '@/store/useFleetStore';

export interface TransportConfig {
  apiUrl: string;
  wsUrl: string;
  heartbeatTimeoutMs: number;
}

export const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/telemetry',
  heartbeatTimeoutMs: 5000,
};

export class TransportAdapter {
  private ws: WebSocket | null = null;
  public config: TransportConfig;
  private isIntentionallyClosed = false;
  private connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: TransportConfig = DEFAULT_TRANSPORT_CONFIG) {
    this.config = { ...config };
  }

  // Update target URLs dynamically at runtime
  updateUrls(apiUrl: string, wsUrl: string) {
    this.config.apiUrl = apiUrl.trim();
    this.config.wsUrl = wsUrl.trim();
  }

  // --- Connect to Real Live Backend with Instant Fallback Protection ---
  connectLive(customWsUrl?: string) {
    if (customWsUrl) {
      this.config.wsUrl = customWsUrl.trim();
    }

    this.isIntentionallyClosed = false;
    this.clearWatchdogs();

    const store = useFleetStore.getState();
    store.connectionStatus = 'connecting';

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      // Connection Timeout Watchdog (if server doesn't respond in 4 seconds)
      this.connectTimeoutTimer = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.warn('[TransportWatchdog] Backend connection timed out. Triggering autonomous fallback.');
          this.executeFailover('Backend connection timed out (no response within 4s)');
        }
      }, 4000);

      this.ws.onopen = () => {
        if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
        useFleetStore.setState({ connectionStatus: 'connected' });
        // Pause local simulation while live stream is active
        useFleetStore.getState().pauseSimulation();
        this.resetWatchdogTimer();
      };

      this.ws.onmessage = (event) => {
        this.resetWatchdogTimer();
        try {
          const payload = JSON.parse(event.data);
          this.handleLiveMessage(payload);
        } catch (e) {
          console.error('[TransportAdapter] Failed to parse backend payload:', e);
        }
      };

      this.ws.onclose = () => {
        if (!this.isIntentionallyClosed) {
          console.warn('[TransportWatchdog] WebSocket connection dropped by server. Auto-falling back.');
          this.executeFailover('Live backend disconnected unexpectedly');
        }
      };

      this.ws.onerror = () => {
        if (!this.isIntentionallyClosed) {
          console.warn('[TransportWatchdog] WebSocket error. Auto-falling back to simulation.');
          this.executeFailover('Backend connection error or host unreachable');
        }
      };
    } catch (e: any) {
      console.warn('[TransportAdapter] Failed to initiate WebSocket. Auto-falling back:', e);
      this.executeFailover(e.message || 'Failed to initialize WebSocket client');
    }
  }

  // Reset heartbeat watchdog; if backend stops sending frames for 6s, failover to sim
  private resetWatchdogTimer() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(() => {
      if (useFleetStore.getState().connectionStatus === 'connected') {
        console.warn('[TransportWatchdog] Heartbeat missed from backend (>5s). Engaging simulation failover.');
        this.executeFailover('Backend heartbeat timed out (no telemetry frames received for 5s)');
      }
    }, this.config.heartbeatTimeoutMs + 1000);
  }

  // --- Execute Failover to Client Simulation ---
  private executeFailover(reason: string) {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.clearWatchdogs();

    const store = useFleetStore.getState();
    store.connectionStatus = 'simulated';

    // Resume simulation seamlessly so robots never freeze
    store.startSimulation();

    // Push central alert notification to inform operator
    if (store.engine) {
      store.engine.alerts.push({
        id: `FAILOVER-${Date.now().toString(36)}`,
        severity: 'warning',
        category: 'system',
        message: `Failover Activated: ${reason}. System auto-switched to Autonomous Simulation Engine with zero downtime.`,
        timestamp: Date.now(),
        resolved: false,
      });
      store.engine.events.push({
        id: `EVT-${Date.now().toString(36)}`,
        type: 'recovery-completed',
        message: `FAILOVER: Live backend dropped → Auto-switched to local simulation engine.`,
        timestamp: Date.now(),
        severity: 'info',
      });
      store.syncFromEngine();
    }
  }

  // --- Switch to Autonomous Simulation Mode Manually ---
  switchToSimulation() {
    this.isIntentionallyClosed = true;
    this.clearWatchdogs();
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    useFleetStore.setState({ connectionStatus: 'simulated' });
    useFleetStore.getState().startSimulation();
  }

  private clearWatchdogs() {
    if (this.connectTimeoutTimer) {
      clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = null;
    }
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private handleLiveMessage(data: any) {
    if (data.type === 'telemetry_sync') {
      useFleetStore.setState({
        robots: data.robots || useFleetStore.getState().robots,
        tasks: data.tasks || useFleetStore.getState().tasks,
        sensors: data.sensors || useFleetStore.getState().sensors,
        faults: data.faults || useFleetStore.getState().faults,
        negotiations: data.negotiations || useFleetStore.getState().negotiations,
        conflicts: data.conflicts || useFleetStore.getState().conflicts,
        deadlocks: data.deadlocks || useFleetStore.getState().deadlocks,
        alerts: data.alerts || useFleetStore.getState().alerts,
        events: data.events || useFleetStore.getState().events,
        analytics: data.analytics || useFleetStore.getState().analytics,
      });
    }
  }

  // Send command to live backend
  sendCommand(action: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    }
  }

  destroy() {
    this.isIntentionallyClosed = true;
    this.clearWatchdogs();
    if (this.ws) this.ws.close();
  }
}

export const globalTransport = new TransportAdapter();
