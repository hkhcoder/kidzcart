import { Component, OnInit } from '@angular/core';

import { AchievementsService, AchievementsMeResponse } from '../../services/achievements.service';
import { Donation } from '../../models/donation';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
})
export class AchievementsComponent implements OnInit {
  loading = true;
  downloading = false;
  error: string | null = null;
  data: AchievementsMeResponse | null = null;

  constructor(private achievements: AchievementsService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.data = await this.achievements.fetchMe();
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Could not load achievements.';
    } finally {
      this.loading = false;
    }
  }

  donationItemsLabel(d: Donation): string {
    if (!d.items?.length) return '—';
    return d.items.map((i) => i.name).join(', ');
  }

  async downloadCertificate(): Promise<void> {
    this.downloading = true;
    this.error = null;
    try {
      const blob = await this.achievements.downloadCertificatePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Certificate.pdf';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Could not download certificate.';
    } finally {
      this.downloading = false;
    }
  }
}
