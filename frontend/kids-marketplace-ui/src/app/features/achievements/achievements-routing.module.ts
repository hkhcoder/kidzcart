import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../guards/auth.guard';
import { AchievementsComponent } from '../../pages/achievements/achievements.component';

const routes: Routes = [
  { path: '', component: AchievementsComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AchievementsRoutingModule {}
