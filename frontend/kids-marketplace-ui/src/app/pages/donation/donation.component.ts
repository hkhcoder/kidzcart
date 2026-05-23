import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DonationService } from '../../services/donation.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

import { DonationItemInput } from '../../models/donation';

const LS_LATEST_COUPON = 'km_latest_coupon';

const DONATION_CATEGORIES = ['books', 'toys', 'clothes'] as const;
type DonationCategory = (typeof DONATION_CATEGORIES)[number];

function parseDonationCategory(raw: string | undefined): DonationCategory {
  const c = (raw || 'books').toLowerCase();
  return DONATION_CATEGORIES.includes(c as DonationCategory) ? (c as DonationCategory) : 'books';
}

@Component({
  selector: 'app-donation',
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.scss'],
})
export class DonationComponent implements OnInit {
  itemName = '';
  category: DonationCategory = 'books';
  note = '';
  condition: 'good' | 'average' | 'new' = 'good';
  ageGroup: '3-5' | '6-8' | '9-12' = '6-8';
  loading = false;

  error: string | null = null;
  success: any | null = null;
  couponCode: string | null = null;
  couponQueued = false;

  categoryTitle = 'Books';
  categoryEmoji = '📚';

  /** Shown in the category picker (same icons as home / products). */
  readonly categoryOptions: { id: DonationCategory; label: string; icon: string }[] = [
    { id: 'books', label: 'Books', icon: 'assets/banners/53.jpg' },
    { id: 'toys', label: 'Toys', icon: 'assets/banners/54.jpg' },
    { id: 'clothes', label: 'Clothes', icon: 'assets/banners/60.jpg' },
  ];

  constructor(
    private auth: AuthService,
    private donations: DonationService,
    private notifications: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const c = parseDonationCategory(params['category']);
      this.category = c;
      const m: Record<DonationCategory, { title: string; emoji: string }> = {
        books: { title: 'Books', emoji: '📚' },
        toys: { title: 'Toys', emoji: '🧸' },
        clothes: { title: 'Clothes', emoji: '👕' },
      };
      const info = m[c];
      this.categoryTitle = info.title;
      this.categoryEmoji = info.emoji;
    });
  }

  /** Switch donation type without leaving the page; updates the ?category= query param. */
  selectCategory(cat: DonationCategory): void {
    if (cat === this.category) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: cat },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  async submit(): Promise<void> {
    this.error = null;
    this.success = null;
    this.couponCode = null;
    this.couponQueued = false;

    const userId = this.auth.userId;
    if (!userId) return;

    const name = this.itemName.trim();
    if (!name) {
      this.error = 'Please add a name for your item.';
      return;
    }

    this.loading = true;
    try {
      const items: DonationItemInput[] = [{ name, category: this.category }];
      const res = await this.donations.submitDonation(items, this.note.trim() || undefined);
      this.success = res.donation;

      this.couponQueued = Boolean(res.coupon?.queued);
      const code = res.coupon?.code ? String(res.coupon.code) : null;
      this.couponCode = code;

      if (code) {
        localStorage.setItem(LS_LATEST_COUPON, code);
      }
      void this.notifications.refreshUnreadCount();
    } catch (e: any) {
      this.error = e?.message ?? 'Donation failed';
    } finally {
      this.loading = false;
    }
  }

  goCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  /** Placeholder text for the item name field, matched to donation category. */
  get itemNamePlaceholder(): string {
    switch (this.category) {
      case 'toys':
        return 'e.g. Building blocks, soft teddy';
      case 'clothes':
        return 'e.g. Hoodie, sneakers (size 7)';
      default:
        return 'e.g. Adventure Tales';
    }
  }
}
