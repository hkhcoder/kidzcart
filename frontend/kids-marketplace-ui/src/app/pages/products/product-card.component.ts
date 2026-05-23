import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product';
import { resolveProductImage } from '../../utils/product-image';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  constructor(private router: Router) {}

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }

  goToDetails(): void {
    this.router.navigate(['/products', this.product.id]);
  }

  getProductImage(): string {
    return resolveProductImage(this.product);
  }

  categoryLabel(): string {
    const c = this.product?.category?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      books: 'Books',
      toys: 'Toys',
      clothes: 'Clothes',
    };
    return map[c] ?? (this.product.category ? this.product.category : 'Shop');
  }
}
