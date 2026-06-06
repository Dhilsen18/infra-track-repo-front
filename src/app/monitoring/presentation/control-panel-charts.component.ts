import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js';

import { IotNodeApiDto, MachineryApiDto } from '../../shared/infrastructure/infratrack-api.contracts';

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

@Component({
  selector: 'app-control-panel-charts',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="charts-grid">
      <div class="chart-card chart-card--machinery">
        <div class="chart-card__head">
          <span class="chart-card__icon material-icons-outlined" aria-hidden="true">precision_manufacturing</span>
          <h3 class="chart-title">{{ 'controlPanel.charts.machineryStatus' | translate }}</h3>
        </div>
        <p class="chart-card__hint">{{ 'controlPanel.charts.machineryHint' | translate }}</p>
        <div class="chart-canvas-wrap">
          <canvas #machCanvas height="210" aria-label="Machinery status chart"></canvas>
        </div>
      </div>
      <div class="chart-card chart-card--nodes">
        <div class="chart-card__head">
          <span class="chart-card__icon material-icons-outlined" aria-hidden="true">sensors</span>
          <h3 class="chart-title">{{ 'controlPanel.charts.nodesOnline' | translate }}</h3>
        </div>
        <p class="chart-card__hint">{{ 'controlPanel.charts.nodesHint' | translate }}</p>
        <div class="chart-canvas-wrap">
          <canvas #nodesCanvas height="210" aria-label="IoT nodes chart"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: `
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
    }
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
    .chart-card {
      position: relative;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.15rem 0.6rem;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }
    .chart-card--machinery {
      border-top: 3px solid #c9a227;
    }
    .chart-card--nodes {
      border-top: 3px solid #1a2b4c;
    }
    .chart-card__head {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.25rem;
    }
    .chart-card__icon {
      font-size: 1.15rem;
      color: #2d8a8a;
    }
    .chart-card--machinery .chart-card__icon {
      color: #c9a227;
    }
    .chart-card--nodes .chart-card__icon {
      color: #1a2b4c;
    }
    .chart-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .chart-card__hint {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      line-height: 1.45;
      color: #94a3b8;
    }
    .chart-canvas-wrap {
      position: relative;
      height: 210px;
      width: 100%;
      min-height: 210px;
      min-width: 200px;
    }
    .chart-canvas-wrap canvas {
      display: block;
      width: 100% !important;
      height: 210px !important;
      max-width: 100%;
    }
  `,
})
export class ControlPanelCharts {
  readonly machinery = input<MachineryApiDto[]>([]);
  readonly iotNodes = input<IotNodeApiDto[]>([]);

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly machCanvas = viewChild<ElementRef<HTMLCanvasElement>>('machCanvas');
  private readonly nodesCanvas = viewChild<ElementRef<HTMLCanvasElement>>('nodesCanvas');

  private machineryChart: Chart | null = null;
  private nodesChart: Chart | null = null;

  /** Evita dibujar antes del primer paint del host (canvas sin tamaño / ref aún null). */
  private readonly chartsHostReady = signal(false);

  constructor() {
    afterNextRender(() => {
      this.chartsHostReady.set(true);
    });

    effect(() => {
      this.chartsHostReady();
      const c1 = this.machCanvas()?.nativeElement;
      const c2 = this.nodesCanvas()?.nativeElement;
      const m = this.machinery();
      const n = this.iotNodes();
      if (!c1 || !c2) {
        return;
      }
      requestAnimationFrame(() => {
        this.drawMachineryChart(c1, m);
        this.drawNodesChart(c2, n);
      });
    });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const c1 = this.machCanvas()?.nativeElement;
      const c2 = this.nodesCanvas()?.nativeElement;
      const m = this.machinery();
      const n = this.iotNodes();
      queueMicrotask(() => {
        if (c1) {
          this.drawMachineryChart(c1, m);
        }
        if (c2) {
          this.drawNodesChart(c2, n);
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      this.machineryChart?.destroy();
      this.nodesChart?.destroy();
    });
  }

  private drawMachineryChart(canvas: HTMLCanvasElement, machinery: MachineryApiDto[]): void {
    this.machineryChart?.destroy();
    this.machineryChart = null;

    let active = 0;
    let maintenance = 0;
    let inactive = 0;
    let other = 0;
    for (const x of machinery) {
      const st = String(x.currentStatus ?? '')
        .trim()
        .toLowerCase();
      if (st === 'active') {
        active++;
      } else if (st === 'maintenance') {
        maintenance++;
      } else if (st === 'inactive') {
        inactive++;
      } else {
        other++;
      }
    }

    const labelActive = this.translate.instant('controlPanel.charts.legendActive');
    const labelMaint = this.translate.instant('controlPanel.charts.legendMaintenance');
    const labelInactive = this.translate.instant('controlPanel.charts.legendInactive');
    const labelOther = this.translate.instant('controlPanel.charts.legendOther');

    const pairs: { label: string; value: number; color: string }[] = [];
    if (active) {
      pairs.push({ label: labelActive, value: active, color: '#c9a227' });
    }
    if (maintenance) {
      pairs.push({ label: labelMaint, value: maintenance, color: '#f59e0b' });
    }
    if (inactive) {
      pairs.push({ label: labelInactive, value: inactive, color: '#94a3b8' });
    }
    if (other) {
      pairs.push({ label: labelOther, value: other, color: '#cbd5e1' });
    }

    if (!pairs.length) {
      this.machineryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [this.translate.instant('controlPanel.charts.noData')],
          datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#475569' } },
          },
        },
      });
    } else {
      this.machineryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: pairs.map((p) => p.label),
          datasets: [
            {
              data: pairs.map((p) => p.value),
              backgroundColor: pairs.map((p) => p.color),
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 11 },
                color: '#475569',
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = Number(ctx.raw);
                  const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((v / total) * 100);
                  return `${ctx.label}: ${v} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
    requestAnimationFrame(() => this.machineryChart?.resize());
  }

  private drawNodesChart(canvas: HTMLCanvasElement, nodes: IotNodeApiDto[]): void {
    this.nodesChart?.destroy();
    this.nodesChart = null;

    let online = 0;
    let offline = 0;
    let other = 0;
    for (const x of nodes) {
      const st = String(x.connectionStatus ?? '')
        .trim()
        .toLowerCase();
      if (st === 'online') {
        online++;
      } else if (st === 'offline') {
        offline++;
      } else {
        other++;
      }
    }

    const labelOn = this.translate.instant('controlPanel.charts.legendOnline');
    const labelOff = this.translate.instant('controlPanel.charts.legendOffline');
    const labelOth = this.translate.instant('controlPanel.charts.legendNodesOther');

    const pairs: { label: string; value: number; color: string }[] = [];
    if (online) {
      pairs.push({ label: labelOn, value: online, color: '#1a2b4c' });
    }
    if (offline) {
      pairs.push({ label: labelOff, value: offline, color: '#cbd5e1' });
    }
    if (other) {
      pairs.push({ label: labelOth, value: other, color: '#e2e8f0' });
    }

    if (!pairs.length) {
      this.nodesChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [this.translate.instant('controlPanel.charts.noData')],
          datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#475569' } },
          },
        },
      });
    } else {
      this.nodesChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: pairs.map((p) => p.label),
          datasets: [
            {
              data: pairs.map((p) => p.value),
              backgroundColor: pairs.map((p) => p.color),
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 11 },
                color: '#475569',
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = Number(ctx.raw);
                  const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((v / total) * 100);
                  return `${ctx.label}: ${v} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
    requestAnimationFrame(() => this.nodesChart?.resize());
  }
}