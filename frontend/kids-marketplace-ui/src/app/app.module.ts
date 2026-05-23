import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PromoStripComponent } from './components/promo-strip/promo-strip.component';

/**
 * Shell only: routing + layout. Feature pages live under `features/*` (lazy-loaded).
 */
@NgModule({
  declarations: [AppComponent, NavbarComponent, PromoStripComponent],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
