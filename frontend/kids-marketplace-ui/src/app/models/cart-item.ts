export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  category?: string;
  /** Same as Product.image — used with resolveProductImage for cart/checkout thumbnails */
  image?: string;
}

