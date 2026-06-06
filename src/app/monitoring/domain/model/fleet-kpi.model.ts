export type FleetKpiId =
  | 'activeTransports'
  | 'weeklyFuel'
  | 'fuelTheftCritical'
  | 'activeWorksites';

export interface FleetKpi {
  id: FleetKpiId;
  value: string;
  unitKey?: string;
  icon: string;
  accent?: 'gold' | 'danger' | 'success' | 'neutral';
}
