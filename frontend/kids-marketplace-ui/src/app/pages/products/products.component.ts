import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product';

/** Delay after last keystroke before updating URL and fetching (ms). */
const SEARCH_DEBOUNCE_MS = 350;

export type ProductSortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

const SORT_PARAM_VALUES: readonly ProductSortOption[] = [
  'default',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
];

function parseSortParam(raw: unknown): ProductSortOption {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return 'default';
  return SORT_PARAM_VALUES.includes(s as ProductSortOption) ? (s as ProductSortOption) : 'default';
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  category = 'books';
  tab: 'all' | 'story' | 'school' = 'all';
  q = '';
  productsList: Product[] = [];
  /** Client-side ordering; also synced to `?sort=` in the URL. */
  sortBy: ProductSortOption = 'default';
  loading = false;
  error: string | null = null;

  private readonly searchInput$ = new Subject<string>();
  private searchDebounceSub?: Subscription;
  private routeSub?: Subscription;
  /** `category|q` — refetch products only when these change, not when only `sort` changes. */
  private lastProductFetchKey = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productApi: ProductService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.searchDebounceSub = this.searchInput$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged())
      .subscribe(() => this.applySearch());

    this.routeSub = this.route.queryParams.subscribe((params) => {
      const category = (params['category'] as string) || 'books';
      const qp = params['q'];
      const q = typeof qp === 'string' ? qp : '';
      this.sortBy = parseSortParam(params['sort']);

      this.category = category;
      this.q = q;
      this.syncTabFromQuery();

      const fetchKey = `${category}|${q}`;
      if (fetchKey !== this.lastProductFetchKey) {
        this.lastProductFetchKey = fetchKey;
        void this.load();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchDebounceSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  /** Fires while typing; debounced search runs via searchInput$ subscription. */
  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  /** Keeps Story / School tabs in sync when `q` comes from the URL. */
  private syncTabFromQuery(): void {
    const t = this.q.trim().toLowerCase();
    if (this.category !== 'books') {
      this.tab = 'all';
      return;
    }
    if (t === 'story') this.tab = 'story';
    else if (t === 'school') this.tab = 'school';
    else this.tab = 'all';
  }

  get categoryTitle(): string {
    const m: Record<string, string> = {
      books: 'Books',
      toys: 'Toys',
      clothes: 'Clothes',
    };
    return m[this.category] ?? 'Products';
  }

  get heroSubtitle(): string {
    const m: Record<string, string> = {
      books: 'Storytime picks, school essentials, and gentle pre-loved reads for every age.',
      toys: 'Fun, safe, and ready for new adventures — add to cart in one tap.',
      clothes: 'Cozy outfits and gear for growing kids. Fresh finds updated often.',
    };
    return m[this.category] ?? m['books'];
  }

  get heroTags(): string[] {
    const m: Record<string, string[]> = {
      books: ['Pre-loved', 'Curated', 'Kid-safe'],
      toys: ['Play-tested', 'Bright & fun', 'Share the joy'],
      clothes: ['Comfy fits', 'Seasonal', 'Sustainable'],
    };
    return m[this.category] ?? m['books'];
  }

  get heroImage(): string {
    const m: Record<string, string> = {
      books: 'assets/banners/53.jpg',
      toys: 'assets/banners/54.jpg',
      clothes: 'assets/banners/60.jpg',
    };
    return m[this.category] ?? m['books'];
  }

  goCategory(cat: string): void {
    this.tab = 'all';
    this.q = '';
    void this.router.navigate(['/products'], {
      queryParams: {
        category: cat,
        q: null,
        sort: this.sortBy === 'default' ? null : this.sortBy,
      },
    });
  }

  setTab(tab: 'all' | 'story' | 'school'): void {
    this.tab = tab;
    if (tab === 'all') this.q = '';
    if (tab === 'story') this.q = 'Story';
    if (tab === 'school') this.q = 'School';
    void this.applySearch();
  }

  /** Updates URL (?category=&q=) and lets queryParams subscription run the API call. */
  applySearch(): void {
    const q = this.q.trim();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.category,
        q: q || null,
        sort: this.sortBy === 'default' ? null : this.sortBy,
      },
      queryParamsHandling: 'merge',
    });
  }

  setSort(mode: ProductSortOption): void {
    if (this.sortBy === mode) return;
    this.sortBy = mode;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: mode === 'default' ? null : mode },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** List from the API, ordered for display. */
  get sortedProducts(): Product[] {
    const list = [...this.productsList];
    switch (this.sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return list.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
      case 'name-desc':
        return list.sort((a, b) =>
          b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })
        );
      case 'default':
      default:
        return list;
    }
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      if (this.q.trim()) {
        this.productsList = await this.productApi.searchProducts(this.category, this.q.trim());
      } else {
        this.productsList = await this.productApi.searchProducts(this.category);
      }
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to load products';
    } finally {
      this.loading = false;
    }
  }

  onAddToCart(product: Product): void {
    this.cart.addProduct(product, 1);
    this.router.navigate(['/cart']);
  }
}

