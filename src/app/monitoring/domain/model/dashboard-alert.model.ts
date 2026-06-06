export type DashboardAlertSeverity = 'warning' | 'critical';
export type DashboardAlertStatus = 'active' | 'resolved';

export interface DashboardAlert {
  id: number;
  /** ISO timestamp desde la API */
  timestamp: string;
  timeLabel: string;
  machineName: string;
  alertType: string;
  description: string;
  severity: DashboardAlertSeverity;
  status: DashboardAlertStatus;
  isAcknowledged: boolean;
}
