import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CheckoutComponent } from '../../pages/checkout/checkout.component';
import { CheckoutRoutingModule } from './checkout-routing.module';

@NgModule({
  declarations: [CheckoutComponent],
  imports: [SharedModule, CheckoutRoutingModule],
})
export class CheckoutModule {}
