import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Logistics administrator assigned to a worksite.
 */
export class WorksiteStaff implements BaseEntity {
  constructor(
    public id: number,
    public fullName: string,
    public email: string,
    public phone: string,
    public licenseNumber: string,
    public status: 'active' | 'inactive',
    public assignedWorksiteIds: number[],
    public alertsLast30Days: number,
    public drivingHoursWeek: number,
    public currentVehicle?: string,
  ) {}
}
