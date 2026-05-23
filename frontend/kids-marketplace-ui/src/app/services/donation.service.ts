import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Donation, DonationItemInput } from '../models/donation';

@Injectable({ providedIn: 'root' })
export class DonationService {
  constructor(private api: ApiService, private auth: AuthService) {}

  async submitDonation(items: DonationItemInput[], note?: string): Promise<{ donation: Donation; coupon: any }> {
    const userId = this.auth.userId;
    if (!userId) throw new Error('Not authenticated');
    return await this.api.post<{ donation: Donation; coupon: any }>('/donations', { userId, items, note: note ?? null }, this.auth.token);
  }

  async listDonations(userId: string): Promise<Donation[]> {
    return await this.api.get<Donation[]>('/donations', this.auth.token, { userId });
  }
}

