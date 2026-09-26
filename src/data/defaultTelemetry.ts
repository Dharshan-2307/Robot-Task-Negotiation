import { IoTTelemetryRow } from '@/types';

// 20-row live poultry farm telemetry dataset provided by user from Google Sheets
export const DEFAULT_IOT_TELEMETRY: IoTTelemetryRow[] = [
  { id: 'IOT-01', datetime: '26/09/2026 00:28:09', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'NORMAL', mode: 'MODE1' },
  { id: 'IOT-02', datetime: '26/09/2026 00:28:39', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'NORMAL', mode: 'MODE1' },
  { id: 'IOT-03', datetime: '26/09/2026 00:29:09', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'WAIT_DRY_RUN', mode: 'MODE2' },
  { id: 'IOT-04', datetime: '26/09/2026 00:29:39', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'TANK_EMPTY', mode: 'MODE3' },
  { id: 'IOT-05', datetime: '26/09/2026 00:30:10', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'OFF', status: 'PIPE_DAMAGE', mode: 'MODE4' },
  { id: 'IOT-06', datetime: '26/09/2026 00:30:40', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'PIPE_NORMAL', mode: 'MODE4' },
  { id: 'IOT-07', datetime: '26/09/2026 00:31:09', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'OFF', status: 'PIPE_DAMAGE', mode: 'MODE4' },
  { id: 'IOT-08', datetime: '26/09/2026 00:31:40', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'NORMAL', mode: 'MODE1' },
  { id: 'IOT-09', datetime: '26/09/2026 00:32:09', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'NORMAL', mode: 'MODE2' },
  { id: 'IOT-10', datetime: '26/09/2026 00:32:40', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'TANK_EMPTY', mode: 'MODE3' },
  { id: 'IOT-11', datetime: '26/09/2026 00:33:10', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 59, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'TANK_EMPTY', mode: 'MODE3' },
  { id: 'IOT-12', datetime: '26/09/2026 00:33:44', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'OFF', status: 'TANK_FULL', mode: 'MODE3' },
  { id: 'IOT-13', datetime: '26/09/2026 00:34:10', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'TANK_EMPTY', mode: 'MODE3' },
  { id: 'IOT-14', datetime: '26/09/2026 00:34:40', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'ON', status: 'TANK_EMPTY', mode: 'MODE3' },
  { id: 'IOT-15', datetime: '26/09/2026 00:35:10', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'WATER', s2: 'NO_WATER', motor: 'OFF', status: 'PIPE2_ERROR', mode: 'MODE4' },
  { id: 'IOT-16', datetime: '26/09/2026 00:35:42', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'PIPE_NORMAL', mode: 'MODE4' },
  { id: 'IOT-17', datetime: '26/09/2026 00:36:10', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'NO_WATER', s2: 'NO_WATER', motor: 'OFF', status: 'PIPE_DAMAGE', mode: 'MODE4' },
  { id: 'IOT-18', datetime: '26/09/2026 00:36:40', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'PIPE_NORMAL', mode: 'MODE4' },
  { id: 'IOT-19', datetime: '26/09/2026 00:37:10', tem1: 32.3, tem2: 31.6, avgTem: 31.95, humidity1: 58, humidity2: 57, s1: 'WATER', s2: 'WATER', motor: 'ON', status: 'PIPE_NORMAL', mode: 'MODE4' },
];
