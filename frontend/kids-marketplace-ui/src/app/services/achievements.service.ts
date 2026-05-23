import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Donation } from '../models/donation';

export interface AchievementCertificate {
  certificateId: string;
  title: string;
  subtitle: string;
  recipientName: string;
  body: string;
  issuedAt: string;
  issuedAtDisplay: string;
  donationCount: number;
  issuerName: string;
  quote: string;
}

export interface AchievementsMeResponse {
  donations: Donation[];
  certificate: AchievementCertificate;
}

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  constructor(private api: ApiService, private auth: AuthService) {}

  async fetchMe(): Promise<AchievementsMeResponse> {
    const token = this.auth.token;
    if (!token) throw new Error('Not authenticated');
    return await this.api.get<AchievementsMeResponse>('/achievements/me', token);
  }

  /** PDF certificate from .NET (QuestPDF). */
  async downloadCertificatePdf(): Promise<Blob> {
    const token = this.auth.token;
    if (!token) throw new Error('Not authenticated');
    return await this.api.getBlob('/achievements/me/certificate', token);
  }
}
