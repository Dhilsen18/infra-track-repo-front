import { Component, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (mode() === 'header') {
      <div class="lang-switcher lang-switcher--header" role="group" [attr.aria-label]="'common.language' | translate">
        <span class="lang-switcher__globe material-icons-outlined" aria-hidden="true">language</span>
        <button type="button" [class.active]="currentLang === 'en'" (click)="use('en')">EN</button>
        <button type="button" [class.active]="currentLang === 'es'" (click)="use('es')">ES</button>
      </div>
    } @else {
      <div class="floating-lang-switcher">
        <button type="button" [class.active]="currentLang === 'es'" (click)="use('es')">ES</button>
        <div class="divider"></div>
        <button type="button" [class.active]="currentLang === 'en'" (click)="use('en')">EN</button>
      </div>
    }
  `,
  styles: [`
    .floating-lang-switcher {
      position: fixed;
      bottom: 30px;
      right: 30px;
      display: flex;
      align-items: center;
      background: white;
      border-radius: 30px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      padding: 4px;
      z-index: 1000;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .divider {
      width: 1px;
      height: 20px;
      background: #e0e0e0;
      margin: 0 4px;
    }

    .floating-lang-switcher button {
      cursor: pointer;
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 24px;
      font-weight: 600;
      color: #757575;
      font-family: inherit;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .floating-lang-switcher button:hover {
      background: #f5f5f5;
      color: #333;
    }

    .floating-lang-switcher button.active {
      background: #f4c20d;
      color: #0a1118;
      box-shadow: 0 2px 8px rgba(244, 194, 13, 0.35);
    }

    .lang-switcher--header {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      padding: 0.25rem 0.35rem;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .lang-switcher__globe {
      font-size: 1.1rem;
      color: #64748b;
      margin-left: 0.25rem;
      margin-right: 0.1rem;
    }

    .lang-switcher--header button {
      cursor: pointer;
      min-width: 2.1rem;
      padding: 0.35rem 0.55rem;
      border: none;
      border-radius: 7px;
      background: transparent;
      font-weight: 700;
      font-size: 0.78rem;
      color: #64748b;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }

    .lang-switcher--header button:hover {
      color: #0a1118;
      background: #eef2f6;
    }

    .lang-switcher--header button.active {
      background: #0a1118;
      color: #ffffff;
    }
  `],
})
export class LanguageSwitcher {
  readonly mode = input<'floating' | 'header'>('floating');

  private readonly translate = inject(TranslateService);

  get currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  use(lang: string): void {
    this.translate.use(lang);
  }
}
