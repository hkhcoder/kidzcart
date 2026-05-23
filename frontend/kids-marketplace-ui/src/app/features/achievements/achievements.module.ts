import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AchievementsComponent } from '../../pages/achievements/achievements.component';
import { AchievementsRoutingModule } from './achievements-routing.module';

@NgModule({
  declarations: [AchievementsComponent],
  imports: [SharedModule, AchievementsRoutingModule],
})
export class AchievementsModule {}
