import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ControlPanelStore } from '../../../application/control-panel.store';
import { FleetKpiId } from '../../../domain/model/fleet-kpi.model';
import { ControlPanelCharts } from '../../control-panel-charts.component';
import { ControlPanelWorksitesMap } from '../../components/control-panel-worksites-map/control-panel-worksites-map';
import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';

@Component({
  selector: 'app-control-panel-view',
  standalone: true,
  imports: [TranslatePipe, ControlPanelCharts, DecimalPipe, PageHeaderCard, ControlPanelWorksitesMap],
  templateUrl: './control-panel-view.html',
  styleUrl: './control-panel-view.css',
})
export class ControlPanelView {
  protected readonly store = inject(ControlPanelStore);

  isKpiSelected(id: FleetKpiId): boolean {
    return this.store.selectedKpiId() === id;
  }
}
