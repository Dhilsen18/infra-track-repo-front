import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-owner-login-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './owner-login-page.html',
  styleUrl: './owner-login-page.css',
})
export class OwnerLoginPage {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly hidePassword = signal(true);

  back(): void {
    void this.router.navigate(['/iam/sign-in']);
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    const mail = this.email().trim() || 'owner@infratrack.demo';
    this.store.simulateLogin(mail, this.password(), 1, 'owner');
    void this.router.navigateByUrl('/control-panel');
  }
}
