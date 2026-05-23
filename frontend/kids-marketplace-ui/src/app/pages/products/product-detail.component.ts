import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product';
import { resolveProductImage } from '../../utils/product-image';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  product: Product | null = null;
  qty: number = 1;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private products: ProductService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async (pm) => {
      const id = pm.get('id');
      if (!id) return;
      await this.load(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private async load(id: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.product = await this.products.getProduct(id);
    } catch (e: any) {
      this.error = e?.message ?? 'Product not found';
    } finally {
      this.loading = false;
    }
  }

  add(): void {
    if (!this.product) return;
    const safeQty = Math.max(1, Math.floor(Number(this.qty) || 1));
    this.cart.addProduct(this.product, safeQty);
    this.router.navigate(['/cart']);
  }

  categoryKicker(p: Product): string {
    const c = (p.category || '').toLowerCase();
    if (c === 'toys') return 'Toy time 🧸';
    if (c === 'clothes') return 'Wear it well 👕';
    return 'Story time 📚';
  }

  taglineFor(p: Product): string {
    const c = (p.category || '').toLowerCase();
    if (c === 'toys') return 'Ready for giggles, games, and make-believe!';
    if (c === 'clothes') return 'Cozy, cute, and ready for your next adventure.';
    return 'A page-turner for curious kids and bedtime heroes.';
  }

  productImage(p: Product): string {
    return resolveProductImage(p);
  }
}
