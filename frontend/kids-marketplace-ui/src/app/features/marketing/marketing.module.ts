import { NgModule } from '@angular/core';

import { TrustStripComponent } from '../../components/trust-strip/trust-strip.component';
import { AboutComponent } from '../../pages/about/about.component';
import { HomeComponent } from '../../pages/home/home.component';
import { SharedModule } from '../../shared/shared.module';
import { MarketingRoutingModule } from './marketing-routing.module';

@NgModule({
  declarations: [HomeComponent, AboutComponent],
  imports: [SharedModule, MarketingRoutingModule, TrustStripComponent],
})
export class MarketingModule {}
