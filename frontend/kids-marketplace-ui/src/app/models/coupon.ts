export interface Coupon {
  code: string;
  userId: string;
  discount: number;
  used?: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  reason: string;
  discount: number;
}

