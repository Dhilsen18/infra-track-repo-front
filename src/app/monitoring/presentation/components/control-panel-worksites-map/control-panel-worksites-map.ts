import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';
import { debounceTime, fromEvent } from 'rxjs';

export interface ControlPanelMapMarker {
  lat: number;
  lng: number;
  label: string;
  status: string;
}

function markerFill(status: string): string {
  if (status === 'active') {
    return '#c9a227';
  }
  if (status === 'maintenance') {
    return '#e07b2d';
  }
  if (status === 'finished') {
    return '#94a3b8';
  }
  return '#2d8a8a';
}

@Component({
  selector: 'app-control-panel-worksites-map',
  imports: [TranslatePipe],
  templateUrl: './control-panel-worksites-map.html',
  styleUrl: './control-panel-worksites-map.css',
})
export class ControlPanelWorksitesMap {
  readonly markers = input.required<ControlPanelMapMarker[]>();

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private mapResizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const markers = this.markers();
      const el = this.mapHost()?.nativeElement;
      if (!el) {
        return;
      }
      if (!this.map) {
        this.initMap(el);
      }
      this.renderMarkers(markers);
    });

    this.destroyRef.onDestroy(() => this.teardownMap());
  }

  private initMap(el: HTMLElement): void {
    this.map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([-12.06, -77.035], 10);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);
    this.map.whenReady(() => {
      queueMicrotask(() => this.map?.invalidateSize());
      setTimeout(() => this.map?.invalidateSize(), 250);
    });
    this.mapResizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.map?.invalidateSize());
    });
    this.mapResizeObserver.observe(el);
    fromEvent(window, 'resize')
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.zone.run(() => this.map?.invalidateSize()));
  }

  private renderMarkers(markers: ControlPanelMapMarker[]): void {
    if (!this.map || !this.layerGroup) {
      return;
    }
    this.layerGroup.clearLayers();
    const points: L.LatLngTuple[] = [];

    for (const marker of markers) {
      points.push([marker.lat, marker.lng]);
      const dot = L.circleMarker([marker.lat, marker.lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: markerFill(marker.status),
        fillOpacity: 0.95,
      });
      dot.bindTooltip(marker.label, { direction: 'top', offset: [0, -8] });
      dot.addTo(this.layerGroup);
    }

    if (points.length === 1) {
      this.map.setView(points[0], 12);
    } else if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 12 });
    }

    queueMicrotask(() => this.map?.invalidateSize());
  }

  private teardownMap(): void {
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    this.layerGroup?.clearLayers();
    this.layerGroup = null;
    this.map?.remove();
    this.map = null;
  }
}
