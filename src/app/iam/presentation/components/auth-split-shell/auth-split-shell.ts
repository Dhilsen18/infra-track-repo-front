import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Split-screen IAM shell: branded hero (left) + white form panel (right).
 */
@Component({
  selector: 'app-auth-split-shell',
  imports: [TranslatePipe, LanguageSwitcher],
  templateUrl: './auth-split-shell.html',
  styleUrl: './auth-split-shell.css',
})
export class AuthSplitShell {
  readonly heroEyebrowKey = input.required<string>();
  readonly heroTitleKey = input.required<string>();
  readonly heroDescKey = input.required<string>();
}
