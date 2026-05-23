import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ProductCardComponent } from '../../pages/products/product-card.component';
import { ProductDetailComponent } from '../../pages/products/product-detail.component';
import { ProductsComponent } from '../../pages/products/products.component';
import { ShopRoutingModule } from './shop-routing.module';

@NgModule({
  declarations: [ProductsComponent, ProductDetailComponent, ProductCardComponent],
  imports: [SharedModule, ShopRoutingModule],
})
export class ShopModule {}
