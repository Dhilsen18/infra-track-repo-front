import { Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';

import { SiteManagementStore } from '../../../../site-management/application/site-management.store';

import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';



import { IamStore } from '../../../../iam/application/iam.store';
import { PlanLimitsService } from '../../../application/plan-limits.service';

import { LanguageSwitcher } from '../language-switcher/language-switcher';



@Component({

  selector: 'app-shell-layout',

  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, LanguageSwitcher, TranslatePipe],

  templateUrl: './shell-layout.html',

  styleUrl: './shell-layout.css',

})

export class ShellLayout {

  private readonly router = inject(Router);

  private readonly profileMenuRef = viewChild<ElementRef<HTMLElement>>('profileMenu');



  readonly isSidebarOpen = signal(true);

  readonly profileMenuOpen = signal(false);

  readonly iam = inject(IamStore);
  readonly planLimits = inject(PlanLimitsService);
  private readonly siteStore = inject(SiteManagementStore);

  readonly role = this.iam.role;

  readonly canAddWorksite = computed(() =>
    this.planLimits.canAddWorksite(this.siteStore.worksites().length),
  );



  readonly userInitial = computed(() => {

    const name = this.iam.username();

    return name ? name.charAt(0).toUpperCase() : '?';

  });



  readonly roleLabelKey = computed(() =>

    this.role() === 'admin' ? 'shell.roleAdmin' : 'shell.roleOwner',

  );



  toggleSidebar(): void {

    this.isSidebarOpen.update((v) => !v);

  }



  toggleProfileMenu(): void {

    this.profileMenuOpen.update((v) => !v);

  }



  closeProfileMenu(): void {

    this.profileMenuOpen.set(false);

  }



  signOut(): void {

    this.closeProfileMenu();

    this.iam.signOut(this.router);

  }



  @HostListener('document:click', ['$event'])

  onDocumentClick(event: MouseEvent): void {

    const menu = this.profileMenuRef()?.nativeElement;

    if (menu && !menu.contains(event.target as Node)) {

      this.closeProfileMenu();

    }

  }

}

