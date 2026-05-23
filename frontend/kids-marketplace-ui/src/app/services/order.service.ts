import { Injectable } from '@angular/core';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { CheckoutRequest, CheckoutResponse, Order } from '../models/order';
import { CouponValidationResponse } from '../models/coupon';

// Note: coupon validation response shape lives in `models/coupon.ts` in our codebase,
// but order validation is re-used by checkout for MVP.

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService, private auth: AuthService) {}

  async validateCoupon(code: string): Promise<CouponValidationResponse> {
    const userId = this.auth.userId;
    if (!userId) throw new Error('Not authenticated');
    return await this.api.post<CouponValidationResponse>('/coupon/validate', { userId, code }, this.auth.token);
  }

  async checkout(req: CheckoutRequest): Promise<CheckoutResponse> {
    return await this.api.post<CheckoutResponse>('/orders/checkout', req, this.auth.token);
  }

  async listOrders(userId: string): Promise<Order[]> {
    return await this.api.get<Order[]>('/orders', this.auth.token, { userId });
  }
}

