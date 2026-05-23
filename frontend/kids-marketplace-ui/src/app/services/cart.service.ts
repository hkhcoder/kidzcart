import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Product } from '../models/product';
import { CartItem } from '../models/cart-item';

const LS_CART_KEY = 'km_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.loadItems());
  public readonly items$ = this.itemsSubject.asObservable();

  private loadItems(): CartItem[] {
    try {
      const raw = localStorage.getItem(LS_CART_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }

  private persist(items: CartItem[]): void {
    try {
      localStorage.setItem(LS_CART_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  get subtotal(): number {
    return this.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  addProduct(product: Product, qty: number = 1): void {
    const existing = this.items.find((i) => i.productId === product.id);
    let next: CartItem[];
    if (existing) {
      next = this.items.map((i) =>
        i.productId === product.id
          ? {
              ...i,
              qty: i.qty + qty,
              image: product.image ?? i.image,
              category: product.category ?? i.category,
            }
          : i,
      );
    } else {
      next = [
        ...this.items,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty,
          category: product.category,
          image: product.image,
        },
      ];
    }
    this.itemsSubject.next(next);
    this.persist(next);
  }

  updateQty(productId: string, qty: number): void {
    const safeQty = Math.max(1, Math.floor(qty));
    const next = this.items.map((i) => (i.productId === productId ? { ...i, qty: safeQty } : i));
    this.itemsSubject.next(next);
    this.persist(next);
  }

  removeItem(productId: string): void {
    const next = this.items.filter((i) => i.productId !== productId);
    this.itemsSubject.next(next);
    this.persist(next);
  }

  clear(): void {
    this.itemsSubject.next([]);
    this.persist([]);
  }
}

