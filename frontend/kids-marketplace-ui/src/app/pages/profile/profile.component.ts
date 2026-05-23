import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { DonationService } from '../../services/donation.service';
import { NotificationService } from '../../services/notification.service';
import { CouponValidationResponse } from '../../models/coupon';
import { Order } from '../../models/order';
import { Donation } from '../../models/donation';
import { AppNotification } from '../../models/notification';

const LS_LATEST_COUPON = 'km_latest_coupon';

/** Items shown before "Show more" when a panel is expanded. */
const PREVIEW_LIMIT = 2;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  /** Exposed for template (list preview before "Show more"). */
  readonly previewLimit = PREVIEW_LIMIT;

  user: any = null;
  latestCoupon: string | null = null;
  couponValidation: CouponValidationResponse | null = null;

  orders: Order[] = [];
  donationsList: Donation[] = [];
  notifications: AppNotification[] = [];
  notificationsError: string | null = null;
  error: string | null = null;

  redisState: 'idle' | 'loading' | 'done' | 'error' = 'idle';
  rabbitState: 'idle' | 'loading' | 'done' | 'error' = 'idle';
  redisBody: unknown = null;
  rabbitBody: unknown = null;
  redisError: string | null = null;
  rabbitError: string | null = null;

  constructor(
    private auth: AuthService,
    private ordersService: OrderService,
    private donationApi: DonationService,
    private notificationsApi: NotificationService,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    this.error = null;
    try {
      const userId = this.auth.userId;
      if (!userId) return;

      const me = await this.auth.fetchMe();
      this.user = me.user;

      this.latestCoupon = this.getLatestCoupon();
      if (this.latestCoupon) {
        try {
          this.couponValidation = await this.ordersService.validateCoupon(this.latestCoupon);
        } catch {
          this.couponValidation = null;
        }
      }

      this.orders = await this.ordersService.listOrders(userId);
      this.donationsList = await this.donationApi.listDonations(userId);
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to load profile';
    }
    if (this.auth.userId) {
      await this.loadNotifications();
    }
  }

  private getLatestCoupon(): string | null {
    try {
      const v = localStorage.getItem(LS_LATEST_COUPON);
      return v && v.trim() ? v : null;
    } catch {
      return null;
    }
  }

  donationItemsLabel(d: Donation): string {
    return d.items.map((it) => it.name).join(', ');
  }

  private async loadNotifications(): Promise<void> {
    this.notificationsError = null;
    try {
      this.notifications = await this.notificationsApi.list();
      await this.notificationsApi.refreshUnreadCount();
    } catch (e: any) {
      this.notifications = [];
      this.notificationsError = e?.message ?? 'Could not load notifications. Is the API running on :4002?';
    }
  }

  async markNotificationRead(n: AppNotification): Promise<void> {
    if (n.read) return;
    try {
      await this.notificationsApi.markRead(n.id);
      n.read = true;
      await this.notificationsApi.refreshUnreadCount();
    } catch {
      /* ignore */
    }
  }

  async checkRedis(): Promise<void> {
    this.redisState = 'loading';
    this.redisError = null;
    this.redisBody = null;
    try {
      const res = await firstValueFrom(this.http.get<Record<string, unknown>>('/api/health/redis'));
      this.redisBody = res;
      this.redisState = 'done';
    } catch (e: any) {
      this.redisState = 'error';
      this.redisError = e?.error?.detail ?? e?.message ?? 'Request failed';
      this.redisBody = e?.error ?? null;
    }
  }

  async checkRabbit(): Promise<void> {
    this.rabbitState = 'loading';
    this.rabbitError = null;
    this.rabbitBody = null;
    try {
      const res = await firstValueFrom(this.http.get<Record<string, unknown>>('/api/health/rabbit'));
      this.rabbitBody = res;
      this.rabbitState = 'done';
    } catch (e: any) {
      this.rabbitState = 'error';
      this.rabbitError = e?.error?.detail ?? e?.message ?? 'Request failed';
      this.rabbitBody = e?.error ?? null;
    }
  }

  async checkBothBackends(): Promise<void> {
    await Promise.all([this.checkRedis(), this.checkRabbit()]);
  }

  redisOk(): boolean | null {
    if (this.redisState !== 'done' || !this.redisBody || typeof this.redisBody !== 'object') {
      return null;
    }
    return (this.redisBody as { ok?: boolean }).ok === true;
  }

  rabbitOk(): boolean | null {
    if (this.rabbitState !== 'done' || !this.rabbitBody || typeof this.rabbitBody !== 'object') {
      return null;
    }
    return (this.rabbitBody as { ok?: boolean }).ok === true;
  }

  redisDisabled(): boolean {
    const r = this.redisBody as { redis?: string } | null;
    return r?.redis === 'disabled';
  }

  rabbitDisabled(): boolean {
    const r = this.rabbitBody as { rabbit?: string } | null;
    return r?.rabbit === 'disabled';
  }

  /**
   * True after a health check when the broker is unreachable (not merely unset in config).
   * Explains why notifications still appear: they are stored in MongoDB, not read from RabbitMQ.
   */
  get rabbitBrokerDown(): boolean {
    if (this.rabbitState === 'error') return true;
    if (this.rabbitState !== 'done' || !this.rabbitBody || typeof this.rabbitBody !== 'object') return false;
    if (this.rabbitDisabled()) return false;
    return (this.rabbitBody as { ok?: boolean }).ok !== true;
  }

  /** Collapsible panels: open by default so PREVIEW_LIMIT items show without a click; "Show more" expands the list. */
  notifPanelOpen = true;
  notifShowAll = false;
  ordersPanelOpen = true;
  ordersShowAll = false;
  donationsPanelOpen = true;
  donationsShowAll = false;

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
    if (!this.notifPanelOpen) this.notifShowAll = false;
  }

  toggleOrdersPanel(): void {
    this.ordersPanelOpen = !this.ordersPanelOpen;
    if (!this.ordersPanelOpen) this.ordersShowAll = false;
  }

  toggleDonationsPanel(): void {
    this.donationsPanelOpen = !this.donationsPanelOpen;
    if (!this.donationsPanelOpen) this.donationsShowAll = false;
  }

  get visibleNotifications(): AppNotification[] {
    if (this.notifShowAll || this.notifications.length <= PREVIEW_LIMIT) return this.notifications;
    return this.notifications.slice(0, PREVIEW_LIMIT);
  }

  get hasMoreNotifications(): boolean {
    return this.notifications.length > PREVIEW_LIMIT && !this.notifShowAll;
  }

  get visibleOrders(): Order[] {
    if (this.ordersShowAll || this.orders.length <= PREVIEW_LIMIT) return this.orders;
    return this.orders.slice(0, PREVIEW_LIMIT);
  }

  get hasMoreOrders(): boolean {
    return this.orders.length > PREVIEW_LIMIT && !this.ordersShowAll;
  }

  get visibleDonations(): Donation[] {
    if (this.donationsShowAll || this.donationsList.length <= PREVIEW_LIMIT) return this.donationsList;
    return this.donationsList.slice(0, PREVIEW_LIMIT);
  }

  get hasMoreDonations(): boolean {
    return this.donationsList.length > PREVIEW_LIMIT && !this.donationsShowAll;
  }
}
