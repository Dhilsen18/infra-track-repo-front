import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import { OpsOnboardingService } from '../../../application/ops-onboarding.service';
import { OnboardingDraftStore } from '../../../application/onboarding-draft.store';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-ops-signup-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './ops-signup-page.html',
  styleUrl: './ops-signup-page.css',
})
export class OpsSignupPage {
  private readonly router = inject(Router);
  private readonly drafts = inject(OnboardingDraftStore);
  private readonly opsOnboarding = inject(OpsOnboardingService);
  protected readonly iam = inject(IamStore);

  private static readonly COMPANY_CODE_PATTERN = /^INFRA-[A-Z0-9-]+$/;

  protected readonly fullName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly companyCode = signal('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hidePassword = signal(true);

  back(): void {
    void this.router.navigate(['/iam/ops/login']);
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    const fullName = this.fullName().trim();
    const email = this.email().trim();
    const password = this.password();
    const companyCode = this.companyCode().trim().toUpperCase();

    if (!fullName || !email || !password || !companyCode) {
      this.errorMessage.set('signup.errorRequired');
      return;
    }

    if (password.length < 8) {
      this.errorMessage.set('signup.errorPasswordLength');
      return;
    }

    if (!OpsSignupPage.COMPANY_CODE_PATTERN.test(companyCode)) {
      this.errorMessage.set('signup.errorInvalidCompanyCode');
      return;
    }

    this.errorMessage.set(null);
    this.drafts.saveOpsDraft({ fullName, email, password, companyCode });
    this.iam
      .signUpThenSignIn(email, password, ['ROLE_ADMIN'], this.router, {
        expectedRole: 'admin',
        afterAuth: (resource) =>
          this.opsOnboarding.provisionStaff(resource, { fullName, email }),
      })
      .subscribe((ok) => {
        if (!ok) {
          this.errorMessage.set('signup.errorProvision');
        }
      });
  }
}
