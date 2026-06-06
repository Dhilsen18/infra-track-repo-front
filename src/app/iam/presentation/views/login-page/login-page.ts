import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

export type AccessEntityType = 'owner' | 'admin';

/** Unified access view: entity type selection. */
@Component({
  selector: 'app-login-page',
  imports: [LanguageSwitcher, TranslatePipe],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly router = inject(Router);

  selectEntity(type: AccessEntityType): void {
    if (type === 'owner') {
      void this.router.navigate(['/iam/owner/login']);
      return;
    }
    void this.router.navigate(['/iam/ops/login']);
  }
}
