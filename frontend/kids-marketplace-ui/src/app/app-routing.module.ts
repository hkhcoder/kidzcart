import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/marketing/marketing.module').then((m) => m.MarketingModule),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthFeatureModule),
  },
  {
    path: 'products',
    loadChildren: () => import('./features/shop/shop.module').then((m) => m.ShopModule),
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then((m) => m.CartModule),
  },
  {
    path: 'checkout',
    loadChildren: () =>
      import('./features/checkout/checkout.module').then((m) => m.CheckoutModule),
  },
  {
    path: 'donate',
    loadChildren: () =>
      import('./features/donation/donation.module').then((m) => m.DonationFeatureModule),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path: 'achievements',
    loadChildren: () =>
      import('./features/achievements/achievements.module').then((m) => m.AchievementsModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
