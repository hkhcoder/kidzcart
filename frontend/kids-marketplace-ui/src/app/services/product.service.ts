import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { Product } from '../models/product';

/** Body for POST /products (optional image: URL or assets/... path). */
export type ProductCreateInput = {
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  id?: string;
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  async listBooks(): Promise<Product[]> {
    return await this.api.get<Product[]>('/products', null, { category: 'books' });
  }

  async searchProducts(category: string, q?: string): Promise<Product[]> {
    const params: Record<string, string> = { category };
    if (q) params['q'] = q;
    return await this.api.get<Product[]>('/products', null, params);
  }

  async getProduct(id: string): Promise<Product> {
    return await this.api.get<Product>(`/products/${encodeURIComponent(id)}`);
  }

  async createProduct(body: ProductCreateInput): Promise<Product> {
    return await this.api.post<Product>('/products', body);
  }
}

