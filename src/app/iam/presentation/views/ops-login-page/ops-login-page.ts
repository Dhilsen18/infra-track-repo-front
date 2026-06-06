import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-ops-login-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './ops-login-page.html',
  styleUrl: './ops-login-page.css',
})
export class OpsLoginPage {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly companyCode = signal('');
  protected readonly hidePassword = signal(true);

  back(): void {
    void this.router.navigate(['/iam/sign-in']);
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    const mail = this.email().trim() || 'ops@infratrack.demo';
    this.store.simulateLogin(mail, this.password(), 2, 'admin');
    void this.router.navigateByUrl('/operacion');
  }
}
