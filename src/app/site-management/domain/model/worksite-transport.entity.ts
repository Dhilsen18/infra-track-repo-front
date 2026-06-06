import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Transport unit operating on a worksite with IoT linkage.
 */
export class WorksiteTransport implements BaseEntity {
  constructor(
    public id: number,
    public worksiteId: number,
    public plateNumber: string,
    public model: string,
    public brand: string,
    public iotNodeId: string,
    public gpsLabel: string,
    public fuelLevelPercent: number,
    public status: 'active' | 'maintenance' | 'inactive',
  ) {}
}
