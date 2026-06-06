import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type WorksiteType = 'road' | 'building' | 'warehouse';
export type WorksiteStatus = 'active' | 'finished';

/**
 * Domain entity for a construction site or branch (zona de obra / sede).
 */
export class Worksite implements BaseEntity {
  constructor(
    public id: number,
    public name: string,
    public city: string,
    public type: WorksiteType,
    public status: WorksiteStatus,
    public address: string,
    public leadEngineer: string,
    public transportCount: number,
    public staffCount: number,
    public latitude?: number,
    public longitude?: number,
  ) {}
}
