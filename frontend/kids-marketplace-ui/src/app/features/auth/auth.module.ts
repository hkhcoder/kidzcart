import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AuthComponent } from '../../pages/auth/auth.component';
import { AuthFeatureRoutingModule } from './auth-routing.module';

@NgModule({
  declarations: [AuthComponent],
  imports: [SharedModule, AuthFeatureRoutingModule],
})
export class AuthFeatureModule {}
