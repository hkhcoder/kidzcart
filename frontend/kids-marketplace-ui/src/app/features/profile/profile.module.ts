import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ProfileComponent } from '../../pages/profile/profile.component';
import { ProfileRoutingModule } from './profile-routing.module';

@NgModule({
  declarations: [ProfileComponent],
  imports: [SharedModule, ProfileRoutingModule],
})
export class ProfileModule {}
