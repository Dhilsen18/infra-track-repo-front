import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-ops-login-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './ops-login-page.html',
  styleUrl: './ops-login-page.css',
})
export class OpsLoginPage {
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly companyCode = signal('');
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  back(): void {
    void this.router.navigate(['/iam/sign-in']);
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    const mail = this.email().trim();
    const password = this.password();
    if (!mail || !password) {
      this.errorMessage.set('signup.errorRequired');
      return;
    }
    this.errorMessage.set(null);
    this.store.signIn(new SignInCommand({ username: mail, password }), this.router, {
      expectedRole: 'admin',
      onError: (reason) =>
        this.errorMessage.set(reason === 'wrongEntity' ? 'login.errorWrongEntity' : 'login.errorAuth'),
    });
  }
}
