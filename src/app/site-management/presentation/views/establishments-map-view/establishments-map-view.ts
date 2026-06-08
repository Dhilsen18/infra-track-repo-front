import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import { debounceTime, fromEvent } from 'rxjs';

import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { SiteManagementStore } from '../../../application/site-management.store';
import { Worksite, WorksiteType } from '../../../domain/model/worksite.entity';

function markerColor(type: WorksiteType, status: string): string {
  if (status === 'finished') {
    return '#94a3b8';
  }
  if (type === 'road') {
    return '#c9a227';
  }
  if (type === 'warehouse') {
    return '#2d8a8a';
  }
  return '#1a2b4c';
}

function statusDotClass(status: string): string {
  return status === 'active' ? 'est-map__dot est-map__dot--active' : 'est-map__dot est-map__dot--finished';
}

@Component({
  selector: 'app-establishments-map-view',
  imports: [RouterLink, TranslatePipe, FormsModule, PageHeaderCard],
  templateUrl: './establishments-map-view.html',
  styleUrl: './establishments-map-view.css',
})
export class EstablishmentsMapView {
  protected readonly store = inject(SiteManagementStore);
  private readonly route = inject(ActivatedRoute);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  protected readonly search = signal('');
  protected readonly selectedId = signal<number | null>(null);

  protected readonly filteredSites = computed(() => {
    const q = this.search().trim().toLowerCase();
    const sites = this.store.worksites();
    if (!q) {
      return sites;
    }
    return sites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q),
    );
  });

  protected readonly selectedSite = computed(() => {
    const id = this.selectedId();
    if (id == null) {
      return undefined;
    }
    return this.store.worksiteById(id);
  });

  protected readonly mappableCount = computed(
    () =>
      this.store.worksites().filter((s) => s.latitude != null && s.longitude != null).length,
  );

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private mapResizeObserver: ResizeObserver | null = null;
  private markerById = new Map<number, L.CircleMarker>();

  constructor() {
    if (!this.store.worksites().length) {
      this.store.loadCatalog();
    }
    const highlight = this.route.snapshot.queryParamMap.get('highlight');
    if (highlight) {
      const id = Number(highlight);
      if (Number.isFinite(id)) {
        this.selectedId.set(id);
      }
    }

    effect(() => {
      const sites = this.store.worksites();
      const selectedId = this.selectedId();
      const el = this.mapHost()?.nativeElement;
      if (!el) {
        return;
      }
      if (!this.map) {
        this.initMap(el);
      }
      this.renderMarkers(sites, selectedId);
    });

    effect(() => {
      const site = this.selectedSite();
      if (!site || site.latitude == null || site.longitude == null || !this.map) {
        return;
      }
      this.map.setView([site.latitude, site.longitude], Math.max(this.map.getZoom(), 13), {
        animate: true,
      });
    });

    this.destroyRef.onDestroy(() => this.teardownMap());
  }

  protected statusDotClass(status: string): string {
    return statusDotClass(status);
  }

  protected typeKey(type: WorksiteType): string {
    return `siteManagement.types.${type}`;
  }

  protected statusKey(status: string): string {
    return `siteManagement.status.${status}`;
  }

  protected selectSite(site: Worksite): void {
    this.selectedId.set(site.id);
  }

  protected clearSelection(): void {
    this.selectedId.set(null);
  }

  protected zoomIn(): void {
    this.map?.zoomIn();
  }

  protected zoomOut(): void {
    this.map?.zoomOut();
  }

  protected recenter(): void {
    if (!this.map) {
      return;
    }
    const site = this.selectedSite();
    if (site?.latitude != null && site.longitude != null) {
      this.map.setView([site.latitude, site.longitude], 13, { animate: true });
      return;
    }
    const points = this.store
      .worksites()
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => [s.latitude!, s.longitude!] as L.LatLngTuple);
    if (points.length === 0) {
      this.map.setView([-12.06, -77.035], 11);
      return;
    }
    if (points.length === 1) {
      this.map.setView(points[0], 13);
      return;
    }
    this.map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }

  private initMap(el: HTMLElement): void {
    this.map = L.map(el, { zoomControl: false }).setView([-12.06, -77.035], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);
    this.layerGroup = L.layerGroup().addTo(this.map);
    this.map.on('click', () => {
      this.zone.run(() => this.clearSelection());
    });
    this.map.whenReady(() => {
      queueMicrotask(() => this.map?.invalidateSize());
      setTimeout(() => this.map?.invalidateSize(), 200);
      setTimeout(() => this.recenter(), 300);
    });
    this.mapResizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.map?.invalidateSize());
    });
    this.mapResizeObserver.observe(el);
    fromEvent(window, 'resize')
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.zone.run(() => this.map?.invalidateSize()));
  }

  private renderMarkers(sites: Worksite[], selectedId: number | null): void {
    if (!this.map || !this.layerGroup) {
      return;
    }
    this.layerGroup.clearLayers();
    this.markerById.clear();
    const points: L.LatLngTuple[] = [];

    for (const site of sites) {
      if (site.latitude == null || site.longitude == null) {
        continue;
      }
      const lat = site.latitude;
      const lng = site.longitude;
      points.push([lat, lng]);
      const selected = site.id === selectedId;
      const marker = L.circleMarker([lat, lng], {
        radius: selected ? 13 : 9,
        color: '#ffffff',
        weight: selected ? 3 : 2,
        fillColor: markerColor(site.type, site.status),
        fillOpacity: site.status === 'finished' ? 0.7 : 0.95,
        bubblingMouseEvents: false,
      });
      marker.bindTooltip(site.name, { direction: 'top', offset: [0, -10] });
      marker.on('click', (e: L.LeafletMouseEvent) => {
        if (e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }
        L.DomEvent.stop(e);
        this.zone.run(() => this.selectSite(site));
      });
      marker.addTo(this.layerGroup);
      this.markerById.set(site.id, marker);
    }

    queueMicrotask(() => this.map?.invalidateSize());
  }

  private teardownMap(): void {
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    this.markerById.clear();
    this.layerGroup?.clearLayers();
    this.layerGroup = null;
    this.map?.remove();
    this.map = null;
  }
}
