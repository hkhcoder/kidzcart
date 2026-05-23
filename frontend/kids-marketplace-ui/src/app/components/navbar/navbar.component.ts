import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user';

export interface NavLink {
  path: string;
  label: string;
  emoji: string;
  exact?: boolean;
}

export interface ShopCategoryLink {
  label: string;
  queryParams: Record<string, string>;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly homeLink: NavLink = { path: '/', label: 'Home', emoji: '🏠', exact: true };

  readonly navLinks: NavLink[] = [
    { path: '/donate', label: 'Donate', emoji: '💝' },
    { path: '/achievements', label: 'Achievements', emoji: '🏅' },
    { path: '/about', label: 'About Us', emoji: '✨' },
  ];

  /** Mega-menu style category links → `/products` query (retail-style nav). */
  readonly shopCategories: ShopCategoryLink[] = [
    { label: 'Books', queryParams: { category: 'books' } },
    { label: 'Toys', queryParams: { category: 'toys' } },
    { label: 'Clothes', queryParams: { category: 'clothes' } },
  ];

  readonly cartCount$: Observable<number>;

  menuOpen = false;

  /** Confirmation dialog before signing out. */
  logoutConfirmOpen = false;

  readonly user$: Observable<User | null>;
  readonly unreadCount$ = this.notifications.unreadCount$;

  private pollSub?: Subscription;
  private pollHandle?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    private notifications: NotificationService,
    cart: CartService,
  ) {
    this.user$ = this.auth.user$;
    this.cartCount$ = cart.items$.pipe(map((items) => items.reduce((n, i) => n + i.qty, 0)));
  }

  ngOnInit(): void {
    this.pollSub = this.auth.user$.subscribe((u) => {
      if (u) {
        void this.notifications.refreshUnreadCount();
      } else {
        this.notifications.unreadCount$.next(0);
      }
    });
    this.pollHandle = setInterval(() => {
      if (this.auth.userId) {
        void this.notifications.refreshUnreadCount();
      }
    }, 45_000);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    if (this.pollHandle != null) {
      clearInterval(this.pollHandle);
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openLogoutConfirm(): void {
    this.closeMenu();
    this.logoutConfirmOpen = true;
  }

  cancelLogout(): void {
    this.logoutConfirmOpen = false;
  }

  confirmLogout(): void {
    this.logoutConfirmOpen = false;
    this.auth.logout();
  }

  /** Prevent backdrop click from closing when clicking inside the dialog card. */
  stopModalDismiss(ev: MouseEvent): void {
    ev.stopPropagation();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeLogoutDialog(ev: Event): void {
    if (!this.logoutConfirmOpen) return;
    ev.preventDefault();
    this.cancelLogout();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      this.menuOpen = false;
    }
  }

  firstName(name: string | undefined): string {
    if (!name?.trim()) {
      return '';
    }
    return name.trim().split(/\s+/)[0] ?? '';
  }
}
