import { DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnInit,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as L from 'leaflet';

import { GpsMapStore } from '../../../application/gps-map.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { GpsMapMarkerVm } from '../../../infrastructure/gps-map.mapper';

function markerFillColor(status: string): string {
  if (status === 'active') {
    return '#22c55e';
  }
  if (status === 'maintenance') {
    return '#f59e0b';
  }
  if (status === 'inactive') {
    return '#94a3b8';
  }
  return '#64748b';
}

@Component({
  selector: 'app-telemetry-view',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe],
  templateUrl: './telemetry-view.html',
  styleUrl: './telemetry-view.css',
})
export class TelemetryView implements OnInit {
  protected readonly gps = inject(GpsMapStore);
  protected readonly iam = inject(IamStore);
  private readonly zone = inject(NgZone);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private mapResizeObserver: ResizeObserver | null = null;

  ngOnInit(): void {
    this.gps.refresh();
  }

  constructor() {
    /**
     * Debe leer `mapHost()`: si `initMap` corre solo en `afterNextRender`, el `#mapHost`
     * a veces aún no existe y el mapa queda sin crear; el efecto se vuelve a ejecutar cuando
     * el contenedor ya está en el DOM.
     */
    effect(() => {
      const markers = this.gps.markers();
      void this.gps.selectedId();
      const el = this.mapHost()?.nativeElement;
      if (!el) {
        return;
      }
      if (!this.map) {
        this.map = L.map(el, { zoomControl: true }).setView([-12.06, -77.035], 11);
        // OSM deprecó el patrón {s}.tile.openstreetmap.org para apps web; usar el host estándar.
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(this.map);
        this.layerGroup = L.layerGroup().addTo(this.map);
        this.map.on('click', (e: L.LeafletMouseEvent) => {
          const t = e.originalEvent?.target;
          if (t instanceof Element && t.closest('.leaflet-interactive')) {
            return;
          }
          this.zone.run(() => this.gps.selectMachinery(null));
        });
        this.map.whenReady(() => {
          queueMicrotask(() => this.map?.invalidateSize());
          setTimeout(() => this.map?.invalidateSize(), 200);
          setTimeout(() => this.map?.invalidateSize(), 800);
        });
        this.mapResizeObserver = new ResizeObserver(() => {
          this.zone.run(() => this.map?.invalidateSize());
        });
        this.mapResizeObserver.observe(el);
        fromEvent(window, 'resize')
          .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.zone.run(() => this.map?.invalidateSize()));
      }
      this.renderMarkers(markers);
    });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.renderMarkers(this.gps.markers());
    });

    this.destroyRef.onDestroy(() => {
      this.teardownMap();
    });
  }

  closePanel(): void {
    this.gps.selectMachinery(null);
  }

  machineStateKey(status: string): string {
    if (status === 'active' || status === 'maintenance' || status === 'inactive') {
      return `telemetry.map.machineState.${status}`;
    }
    return 'telemetry.map.machineState.other';
  }

  nodeConnKey(status: string): string {
    if (status === 'online' || status === 'offline') {
      return `telemetry.map.nodeStatus.${status}`;
    }
    return 'telemetry.map.nodeStatus.other';
  }

  pillClass(status: string): string {
    if (status === 'active') {
      return 'status-pill status-pill--active';
    }
    if (status === 'maintenance') {
      return 'status-pill status-pill--maint';
    }
    if (status === 'inactive') {
      return 'status-pill status-pill--inactive';
    }
    return 'status-pill status-pill--other';
  }

  onOperatorChange(ev: Event, machineryId: number, currentOperatorId: number): void {
    if (!this.gps.httpPutDeleteEnabled()) {
      return;
    }
    const raw = (ev.target as HTMLSelectElement).value;
    const operatorId = Number(raw);
    if (!Number.isFinite(operatorId) || operatorId === currentOperatorId) {
      return;
    }
    this.gps.assignOperator(machineryId, operatorId);
  }

  private teardownMap(): void {
    if (this.mapResizeObserver) {
      this.mapResizeObserver.disconnect();
      this.mapResizeObserver = null;
    }
    this.layerGroup?.clearLayers();
    this.layerGroup = null;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private renderMarkers(markers: GpsMapMarkerVm[]): void {
    if (!this.map || !this.layerGroup) {
      return;
    }
    this.layerGroup.clearLayers();
    const selectedId = this.gps.selectedId();
    for (const m of markers) {
      const fill = markerFillColor(m.status);
      const selected = m.machineryId === selectedId;
      const cm = L.circleMarker([m.lat, m.lng], {
        radius: selected ? 12 : 9,
        color: '#ffffff',
        weight: selected ? 3 : 2,
        fillColor: fill,
        fillOpacity: 0.95,
        bubblingMouseEvents: false,
      });
      cm.bindTooltip(m.title, { direction: 'top', offset: [0, -10] });
      cm.on('click', (e: L.LeafletMouseEvent) => {
        if (e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }
        L.DomEvent.stop(e);
        this.zone.run(() => this.gps.selectMachinery(m.machineryId));
      });
      cm.addTo(this.layerGroup);
    }
    this.fitBounds(markers);
    queueMicrotask(() => this.map?.invalidateSize());
  }

  private fitBounds(markers: GpsMapMarkerVm[]): void {
    if (!this.map || markers.length === 0) {
      return;
    }
    if (markers.length === 1) {
      this.map.setView([markers[0].lat, markers[0].lng], 13);
      return;
    }
    const b = L.latLngBounds(markers.map((x) => [x.lat, x.lng] as L.LatLngTuple));
    this.map.fitBounds(b, { padding: [32, 32], maxZoom: 14 });
  }
}
