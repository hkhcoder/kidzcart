export interface CheckoutItemInput {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface CheckoutRequest {
  userId: string;
  items: CheckoutItemInput[];
  couponCode?: string | null;
}

export interface CheckoutResponse {
  orderId: number;
  subtotal: number;
  discountApplied: number;
  total: number;
  couponCode: string | null;
  paymentStatus: string;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: string;
  itemsJson: string;
  subtotal: number;
  discountApplied: number;
  total: number;
  couponCode: string | null;
  paymentStatus: string;
  createdAt: string;
}

