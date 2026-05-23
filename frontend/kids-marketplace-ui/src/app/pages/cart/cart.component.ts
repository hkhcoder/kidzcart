import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item';
import { resolveProductImage } from '../../utils/product-image';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  items: CartItem[] = [];
  subtotal = 0;

  private sub?: Subscription;

  constructor(private cart: CartService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.cart.items$.subscribe((items) => {
      this.items = items;
      this.subtotal = this.cart.subtotal;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  qtyChanged(productId: string, qty: number): void {
    this.cart.updateQty(productId, qty);
  }

  remove(productId: string): void {
    this.cart.removeItem(productId);
  }

  goCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  cartImage(it: CartItem): string {
    return resolveProductImage({
      id: it.productId,
      name: it.name,
      category: it.category || '',
      image: it.image,
    });
  }
}
