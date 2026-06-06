import { computed, inject, Injectable, signal } from '@angular/core';

import { PlanLimitsService } from '../../shared/application/plan-limits.service';
import { Worksite, WorksiteStatus, WorksiteType } from '../domain/model/worksite.entity';
import { WorksiteStaff } from '../domain/model/worksite-staff.entity';
import { WorksiteTransport } from '../domain/model/worksite-transport.entity';

const STORAGE_KEY = 'infratrack_worksites';

function seedWorksites(): Worksite[] {
  return [
    new Worksite(1, 'Obra Vía Sur — Tramo 3', 'Lima', 'road', 'active', 'Av. Los Incas 1240, Villa El Salvador', 'Ing. Patricia Rojas', 8, 3, -12.189, -76.982),
    new Worksite(2, 'Torre Nexus — Edificación', 'San Isidro', 'building', 'active', 'Calle Las Begonias 480', 'Ing. Luis Mendoza', 5, 2, -12.098, -77.034),
    new Worksite(3, 'Almacén Central Ferretería Norte', 'Los Olivos', 'warehouse', 'active', 'Av. Alfredo Mendiola 6120', 'Ing. Carla Vargas', 12, 4, -11.991, -77.074),
    new Worksite(4, 'Ampliación Ruta 18', 'Ica', 'road', 'finished', 'Panamericana Sur km 312', 'Ing. Jorge Salas', 0, 0, -14.068, -75.728),
  ];
}

function seedStaff(): WorksiteStaff[] {
  return [
    new WorksiteStaff(1, 'Carlos Vizcarra', 'carlos.vizcarra@infratrack.demo', '+51 999 111 222', 'Q1-2045', 'active', [1, 2], 2, 38, 'Volquete BCP-204'),
    new WorksiteStaff(2, 'María Solís', 'maria.solis@infratrack.demo', '+51 999 333 444', 'Q1-2088', 'active', [3], 0, 42, 'Cargador frontal CAT-950'),
    new WorksiteStaff(3, 'Jorge Paredes', 'jorge.paredes@infratrack.demo', '+51 999 555 666', 'Q1-3012', 'active', [1, 3], 1, 35),
    new WorksiteStaff(4, 'Ana Torres', 'ana.torres@infratrack.demo', '+51 999 777 888', 'Q1-3150', 'inactive', [], 0, 0),
  ];
}

function seedTransports(): WorksiteTransport[] {
  return [
    new WorksiteTransport(1, 1, 'BCP-204', 'FH16', 'Volvo', 'IOT-NODE-001', 'Villa El Salvador · en ruta', 72, 'active'),
    new WorksiteTransport(2, 1, 'XYZ-918', '320D', 'Caterpillar', 'IOT-NODE-002', 'Tramo 3 · zona sur', 58, 'active'),
    new WorksiteTransport(3, 2, 'LIM-442', 'Mezcladora', 'Mercedes-Benz', 'IOT-NODE-010', 'Torre Nexus · base', 81, 'active'),
    new WorksiteTransport(4, 3, 'CAT-950', '950 GC', 'Caterpillar', 'IOT-NODE-021', 'Almacén Norte · patio', 64, 'maintenance'),
    new WorksiteTransport(5, 3, 'NOR-118', 'Actros', 'Mercedes-Benz', 'IOT-NODE-022', 'Ruta despacho Mz. C', 45, 'active'),
  ];
}

@Injectable({ providedIn: 'root' })
export class SiteManagementStore {
  private readonly planLimits = inject(PlanLimitsService);
  private readonly worksitesSignal = signal<Worksite[]>(this.loadWorksites());
  private readonly staffSignal = signal<WorksiteStaff[]>(seedStaff());
  private readonly transportsSignal = signal<WorksiteTransport[]>(seedTransports());
  private readonly assignmentStaffIdsSignal = signal<number[]>([]);
  private readonly assignmentWorksiteIdSignal = signal<number | null>(null);
  private readonly snackSignal = signal<string | null>(null);

  readonly worksites = this.worksitesSignal.asReadonly();
  readonly staff = this.staffSignal.asReadonly();
  readonly transports = this.transportsSignal.asReadonly();
  readonly assignmentStaffIds = this.assignmentStaffIdsSignal.asReadonly();
  readonly assignmentWorksiteId = this.assignmentWorksiteIdSignal.asReadonly();
  readonly snack = this.snackSignal.asReadonly();

  readonly activeWorksites = computed(() =>
    this.worksites().filter((w) => w.status === 'active'),
  );

  worksiteById(id: number): Worksite | undefined {
    return this.worksites().find((w) => w.id === id);
  }

  staffById(id: number): WorksiteStaff | undefined {
    return this.staff().find((s) => s.id === id);
  }

  staffForWorksite(worksiteId: number): WorksiteStaff[] {
    return this.staff().filter((s) => s.assignedWorksiteIds.includes(worksiteId));
  }

  transportsForWorksite(worksiteId: number): WorksiteTransport[] {
    return this.transports().filter((t) => t.worksiteId === worksiteId);
  }

  transportById(id: number): WorksiteTransport | undefined {
    return this.transports().find((t) => t.id === id);
  }

  toggleAssignmentStaff(staffId: number): void {
    const current = this.assignmentStaffIdsSignal();
    this.assignmentStaffIdsSignal.set(
      current.includes(staffId) ? current.filter((id) => id !== staffId) : [...current, staffId],
    );
  }

  setAssignmentWorksite(worksiteId: number | null): void {
    this.assignmentWorksiteIdSignal.set(worksiteId);
  }

  confirmAssignment(): boolean {
    const siteId = this.assignmentWorksiteId();
    const staffIds = this.assignmentStaffIds();
    if (siteId == null || staffIds.length === 0) {
      this.snackSignal.set('siteManagement.assignment.errorSelection');
      return false;
    }

    const updated = this.staff().map((member) => {
      if (!staffIds.includes(member.id)) {
        return member;
      }
      const ids = member.assignedWorksiteIds.includes(siteId)
        ? member.assignedWorksiteIds
        : [...member.assignedWorksiteIds, siteId];
      return new WorksiteStaff(
        member.id,
        member.fullName,
        member.email,
        member.phone,
        member.licenseNumber,
        member.status,
        ids,
        member.alertsLast30Days,
        member.drivingHoursWeek,
        member.currentVehicle,
      );
    });

    this.staffSignal.set(updated);
    this.recountStaffOnWorksites();
    this.assignmentStaffIdsSignal.set([]);
    this.assignmentWorksiteIdSignal.set(null);
    this.snackSignal.set('siteManagement.assignment.success');
    return true;
  }

  addWorksite(input: {
    name: string;
    city: string;
    type: WorksiteType;
    address: string;
    leadEngineer: string;
    latitude?: number;
    longitude?: number;
  }): Worksite | null {
    if (!this.planLimits.canAddWorksite(this.worksites().length)) {
      this.snackSignal.set('planLimits.worksiteReached');
      return null;
    }
    const nextId = Math.max(0, ...this.worksites().map((w) => w.id)) + 1;
    const site = new Worksite(
      nextId,
      input.name.trim(),
      input.city.trim(),
      input.type,
      'active',
      input.address.trim(),
      input.leadEngineer.trim(),
      0,
      0,
      input.latitude,
      input.longitude,
    );
    const list = [...this.worksites(), site];
    this.worksitesSignal.set(list);
    this.persistWorksites(list);
    this.snackSignal.set('siteManagement.form.success');
    return site;
  }

  clearSnack(): void {
    this.snackSignal.set(null);
  }

  private recountStaffOnWorksites(): void {
    const counts = new Map<number, number>();
    for (const member of this.staff()) {
      for (const wid of member.assignedWorksiteIds) {
        counts.set(wid, (counts.get(wid) ?? 0) + 1);
      }
    }
    const updated = this.worksites().map(
      (w) =>
        new Worksite(
          w.id,
          w.name,
          w.city,
          w.type,
          w.status,
          w.address,
          w.leadEngineer,
          w.transportCount,
          counts.get(w.id) ?? 0,
          w.latitude,
          w.longitude,
        ),
    );
    this.worksitesSignal.set(updated);
    this.persistWorksites(updated);
  }

  private loadWorksites(): Worksite[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return seedWorksites();
      }
      const parsed = JSON.parse(raw) as Worksite[];
      return parsed.length ? parsed.map(rehydrateWorksite) : seedWorksites();
    } catch {
      return seedWorksites();
    }
  }

  private persistWorksites(list: Worksite[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }
}

function rehydrateWorksite(raw: Worksite): Worksite {
  return new Worksite(
    raw.id,
    raw.name,
    raw.city,
    raw.type,
    raw.status,
    raw.address,
    raw.leadEngineer,
    raw.transportCount ?? 0,
    raw.staffCount ?? 0,
    raw.latitude,
    raw.longitude,
  );
}
