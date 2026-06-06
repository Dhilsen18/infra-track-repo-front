import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-home-redirect',
  template: '',
})
export class HomeRedirect implements OnInit {
  private readonly router = inject(Router);
  private readonly iam = inject(IamStore);

  ngOnInit(): void {
    const target = this.iam.role() === 'admin' ? '/operacion' : '/control-panel';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
