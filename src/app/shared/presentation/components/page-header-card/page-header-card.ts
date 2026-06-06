import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header-card',
  imports: [TranslatePipe],
  templateUrl: './page-header-card.html',
  styleUrl: './page-header-card.css',
})
export class PageHeaderCard {
  readonly eyebrowKey = input<string | undefined>();
  readonly eyebrowText = input<string | undefined>();
  readonly titleKey = input.required<string>();
  readonly introKey = input<string | undefined>();
}
