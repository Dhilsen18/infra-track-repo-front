import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { OnboardingDraftStore } from '../../../application/onboarding-draft.store';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-owner-signup-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './owner-signup-page.html',
  styleUrl: './owner-signup-page.css',
})
export class OwnerSignupPage {
  private readonly router = inject(Router);
  private readonly drafts = inject(OnboardingDraftStore);

  protected readonly fullName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly companyLegalName = signal('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);

  back(): void {
    void this.router.navigate(['/iam/owner/login']);
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    const fullName = this.fullName().trim();
    const email = this.email().trim();
    const password = this.password();
    const companyLegalName = this.companyLegalName().trim();

    if (!fullName || !email || !password || !companyLegalName) {
      this.errorMessage.set('signup.errorRequired');
      return;
    }

    if (password.length < 8) {
      this.errorMessage.set('signup.errorPasswordLength');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.drafts.saveOwnerDraft({ fullName, email, password, companyLegalName });
    void this.router.navigate(['/iam/owner/plans']).then(() => this.submitting.set(false));
  }
}
