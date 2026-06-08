import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

import { OnboardingDraftStore, SubscriptionPlanId } from '../../iam/application/onboarding-draft.store';
import { SiteManagementStore } from '../../site-management/application/site-management.store';
import {
  ControlPanelDashboardHttp,
  ControlPanelDashboardPayload,
} from '../infrastructure/control-panel-dashboard.http';
import {
  buildKpis,
  buildMaintenanceRows,
  buildMapMarkers,
  buildRecentDashboardAlerts,
  MaintenanceRowVm,
  MapMarkerView,
  projectMarkersForMiniMap,
} from '../infrastructure/control-panel.mapper';
import { DashboardAlert } from '../domain/model/dashboard-alert.model';
import { FleetKpi, FleetKpiId } from '../domain/model/fleet-kpi.model';
import { MachineryApiDto, IotNodeApiDto } from '../../shared/infrastructure/infratrack-api.contracts';
import { infratrackPutDeleteAllowed } from '../../shared/infrastructure/infratrack-http-policy';

@Injectable({ providedIn: 'root' })
export class ControlPanelStore {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteManagement = inject(SiteManagementStore);
  private readonly onboarding = inject(OnboardingDraftStore);
  private readonly dashboardHttp = inject(ControlPanelDashboardHttp);

  private readonly kpisSignal = signal<FleetKpi[]>([]);
  private readonly alertsSignal = signal<DashboardAlert[]>([]);
  private readonly mapMarkersSignal = signal<MapMarkerView[]>([]);
  private readonly maintenanceSignal = signal<MaintenanceRowVm[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly ackErrorSignal = signal<string | null>(null);
  private readonly acknowledgePendingId = signal<number | null>(null);
  private readonly cachedPayload = signal<ControlPanelDashboardPayload | null>(null);

  private readonly selectedKpiSignal = signal<FleetKpiId | null>(null);

  readonly kpis = computed(() => this.kpisSignal());
  readonly alerts = computed(() => this.alertsSignal());
  readonly mapMarkers = computed(() => {
    const worksites = this.siteManagement.activeWorksites();
    if (worksites.length) {
      return worksites
        .filter((w) => Number.isFinite(w.latitude) && Number.isFinite(w.longitude))
        .map((w) => ({
          lat: w.latitude as number,
          lng: w.longitude as number,
          label: w.name,
          status: w.status,
        }));
    }
    return this.mapMarkersSignal();
  });
  readonly mapMarkersProjected = computed(() => projectMarkersForMiniMap(this.mapMarkers()));
  readonly maintenanceRows = computed(() => this.maintenanceSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly loadError = computed(() => this.errorSignal());
  readonly acknowledgeError = computed(() => this.ackErrorSignal());
  readonly acknowledgePendingFor = computed(() => this.acknowledgePendingId());
  readonly selectedKpiId = computed(() => this.selectedKpiSignal());
  readonly machinery = computed<MachineryApiDto[]>(() => this.cachedPayload()?.machinery ?? []);
  readonly iotNodes = computed<IotNodeApiDto[]>(() => this.cachedPayload()?.iotNodes ?? []);
  readonly activeWorksites = computed(() => this.siteManagement.activeWorksites());
  readonly companyName = computed(
    () => this.onboarding.ownerDraft()?.companyLegalName ?? 'Constructora InfraTrack S.A.C.',
  );
  readonly planId = computed<SubscriptionPlanId>(() => this.onboarding.selectedPlan() ?? 'premium');
  readonly planLabelKey = computed(() => {
    const plan = this.planId();
    if (plan === 'basic') {
      return 'signup.planBasicName';
    }
    if (plan === 'enterprise') {
      return 'signup.planEnterpriseName';
    }
    return 'signup.planPremiumName';
  });

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.rebuildFromCache());
    if (!this.siteManagement.worksites().length) {
      this.siteManagement.loadCatalog();
    }
    this.refresh();
  }

  httpPutDeleteEnabled(): boolean {
    return infratrackPutDeleteAllowed();
  }

  refresh(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.ackErrorSignal.set(null);
    this.dashboardHttp.loadDashboard$().subscribe({
      next: (payload) => {
        this.cachedPayload.set(payload);
        this.applyPayload(payload);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('controlPanel.load.error');
      },
    });
  }

  acknowledgeAlert(alertId: number): void {
    const cache = this.cachedPayload();
    if (!cache) {
      return;
    }
    const alert = cache.alerts.find((a) => a.id === alertId);
    if (!alert || alert.isAcknowledged) {
      return;
    }
    this.acknowledgePendingId.set(alertId);
    this.ackErrorSignal.set(null);
    this.dashboardHttp.acknowledgeAlert$(alertId).subscribe({
      next: () => {
        const nextAlerts = cache.alerts.map((a) =>
          a.id === alertId ? { ...a, isAcknowledged: true } : a,
        );
        const nextPayload: ControlPanelDashboardPayload = { ...cache, alerts: nextAlerts };
        this.cachedPayload.set(nextPayload);
        this.applyPayload(nextPayload);
        this.acknowledgePendingId.set(null);
      },
      error: () => {
        this.acknowledgePendingId.set(null);
        this.ackErrorSignal.set('controlPanel.alerts.ackError');
      },
    });
  }

  private rebuildFromCache(): void {
    const payload = this.cachedPayload();
    if (payload) {
      this.applyPayload(payload);
    }
  }

  private applyPayload(payload: ControlPanelDashboardPayload): void {
    const locale = this.translate.currentLang || 'en';
    this.kpisSignal.set(
      buildKpis(
        payload.alerts,
        payload.machinery,
        this.siteManagement.activeWorksites().length,
        payload.telemetryData,
      ),
    );
    this.alertsSignal.set(buildRecentDashboardAlerts(payload.alerts, payload.machinery, locale, 5));
    this.mapMarkersSignal.set(
      buildMapMarkers(payload.alerts, payload.machinery, payload.telemetryData, payload.iotNodes),
    );
    this.maintenanceSignal.set(buildMaintenanceRows(payload.maintenanceRecords, payload.machinery));
  }

  selectKpi(id: FleetKpiId): void {
    this.selectedKpiSignal.set(this.selectedKpiSignal() === id ? null : id);
  }
}
