import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SiteFooterComponent } from '../components/site-footer/site-footer.component';

/**
 * Re-exported by lazy feature modules so templates get *ngIf, ngModel, routerLink, etc.
 */
@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  declarations: [SiteFooterComponent],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SiteFooterComponent],
})
export class SharedModule {}
