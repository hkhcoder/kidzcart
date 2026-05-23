import { Product } from '../models/product';

/**
 * Turns DB values like "a", "a.jpg", or full "assets/products/a.jpg" into a usable src.
 */
function normalizeStoredImage(raw: string | undefined): string {
  const s = (raw ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('assets/')) return s;
  if (s.startsWith('/assets/')) return s.slice(1);
  // Bare filename or short token (e.g. user stored "a" meaning a.jpg in assets/products)
  if (!s.includes('/')) {
    const hasExt = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(s);
    const file = hasExt ? s : `${s}.jpg`;
    return `assets/products/${file}`;
  }
  return s;
}

/**
 * Mongo ids like p-a … p-z map to lettered files (even if `image` was never set in DB).
 */
function imageFromLetterProductId(id: string | undefined): string | null {
  if (!id) return null;
  const m = /^p-([a-z])$/i.exec(String(id).trim());
  if (!m) return null;
  return `assets/products/${m[1].toLowerCase()}.jpg`;
}

/** Fields needed to resolve an image (Product, CartItem, etc.). */
export type ProductImageSource = Pick<Product, 'id' | 'name' | 'category' | 'image'>;

/**
 * Resolves the image URL for a product.
 * - Uses `product.image` from API when present (after normalizing bare names).
 * - Ids `p-a` … `p-z` → `assets/products/{letter}.jpg` when image is missing.
 * - Otherwise category banners or book title heuristics (SVGs) / default book banner.
 */
export function resolveProductImage(p: ProductImageSource): string {
  const normalized = normalizeStoredImage(p.image);
  if (normalized) {
    return normalized;
  }

  const fromId = imageFromLetterProductId(p.id);
  if (fromId) {
    return fromId;
  }

  const cat = (p.category || '').toLowerCase();
  if (cat === 'toys') {
    return 'assets/banners/54.jpg';
  }
  if (cat === 'clothes') {
    return 'assets/banners/60.jpg';
  }

  const name = (p.name || '').toLowerCase();
  const bookMap: Record<string, string> = {
    abc: 'assets/products/book-abc.svg',
    color: 'assets/products/book-colors.svg',
    colours: 'assets/products/book-colors.svg',
    adventure: 'assets/products/book-adventure.svg',
  };

  for (const [key, imagePath] of Object.entries(bookMap)) {
    if (name.includes(key)) {
      return imagePath;
    }
  }

  return 'assets/banners/53.jpg';
}
