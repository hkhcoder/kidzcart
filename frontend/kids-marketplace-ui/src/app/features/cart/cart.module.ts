import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CartComponent } from '../../pages/cart/cart.component';
import { CartRoutingModule } from './cart-routing.module';

@NgModule({
  declarations: [CartComponent],
  imports: [SharedModule, CartRoutingModule],
})
export class CartModule {}
