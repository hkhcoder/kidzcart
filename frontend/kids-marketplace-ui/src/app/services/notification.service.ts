import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { AppNotification } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Unread count for navbar badge. */
  readonly unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private api: ApiService, private auth: AuthService) {}

  async list(): Promise<AppNotification[]> {
    const userId = this.auth.userId;
    if (!userId) return [];
    return await this.api.get<AppNotification[]>('/notifications', this.auth.token, { userId });
  }

  async markRead(notificationId: string): Promise<void> {
    const userId = this.auth.userId;
    if (!userId) return;
    await this.api.patch<{ ok: boolean }>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      { userId },
      this.auth.token
    );
  }

  /** Recompute unread count (call after login, donation, mark-read, or on a timer). */
  async refreshUnreadCount(): Promise<void> {
    const userId = this.auth.userId;
    if (!userId) {
      this.unreadCount$.next(0);
      return;
    }
    try {
      const items = await this.list();
      const n = items.filter((x) => !x.read).length;
      this.unreadCount$.next(n);
    } catch {
      this.unreadCount$.next(0);
    }
  }
}
