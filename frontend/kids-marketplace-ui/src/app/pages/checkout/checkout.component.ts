import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { CouponValidationResponse } from '../../models/coupon';
import { CartItem } from '../../models/cart-item';

import { CheckoutRequest } from '../../models/order';

const LS_LATEST_COUPON = 'km_latest_coupon';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  items: CartItem[] = [];
  subtotal = 0;

  couponCode = '';
  validation: CouponValidationResponse | null = null;
  couponError: string | null = null;
  error: string | null = null;
  paying = false;

  estimatedDiscount = 0;
  total = 0;

  private sub?: Subscription;

  constructor(
    private cart: CartService,
    private auth: AuthService,
    private orders: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.couponCode = this.getLatestCoupon();
    this.sub = this.cart.items$.subscribe((items) => {
      this.items = items;
      this.subtotal = this.cart.subtotal;
      this.recomputeTotals();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private getLatestCoupon(): string {
    try {
      return localStorage.getItem(LS_LATEST_COUPON) || '';
    } catch {
      return '';
    }
  }

  private recomputeTotals(): void {
    const discountPercent = this.validation?.valid ? this.validation.discount : 0;
    this.estimatedDiscount = Math.floor(this.subtotal * (discountPercent / 100));
    this.total = Math.max(0, this.subtotal - this.estimatedDiscount);
  }

  async validate(): Promise<void> {
    this.couponError = null;
    this.validation = null;
    this.recomputeTotals();

    const code = this.couponCode.trim();
    if (!code) return;

    try {
      this.validation = await this.orders.validateCoupon(code);
      this.recomputeTotals();
      if (!this.validation.valid) {
        this.couponError = `Coupon not usable: ${this.validation.reason}`;
      }
    } catch (e: any) {
      this.couponError = e?.message ?? 'Failed to validate coupon';
    }
  }

  async pay(): Promise<void> {
    this.error = null;
    if (!this.auth.userId) return;

    if (this.items.length === 0) return;

    this.paying = true;
    try {
      const payload: CheckoutRequest = {
        userId: this.auth.userId,
        items: this.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          qty: it.qty,
        })),
        couponCode: this.couponCode.trim() ? this.couponCode.trim() : null,
      };

      await this.orders.checkout(payload);

      // Clear the used coupon from localStorage so it doesn't auto-fill on the next order
      try {
        localStorage.removeItem(LS_LATEST_COUPON);
      } catch {
        // ignore
      }

      this.couponCode = '';
      this.validation = null;
      this.estimatedDiscount = 0;

      this.cart.clear();
      await this.router.navigate(['/profile']);
    } catch (e: any) {
      this.error = e?.message ?? 'Checkout failed';
    } finally {
      this.paying = false;
    }
  }
}
