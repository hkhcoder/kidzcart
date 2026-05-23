import { Component } from '@angular/core';

export interface PromoPart {
  text: string;
  code?: string;
}

@Component({
  selector: 'app-promo-strip',
  templateUrl: './promo-strip.component.html',
  styleUrls: ['./promo-strip.component.scss'],
})
export class PromoStripComponent {
  /** Sitewide offers — edit here (modular, no template changes). */
  readonly parts: PromoPart[] = [
    { text: 'Use code ' },
    { text: '', code: 'KC5' },
    { text: ' for an extra 5% off — up to ₹150 on carts above ₹1,499 · ' },
    { text: 'Use ' },
    { text: '', code: 'KC10' },
    { text: ' for 10% off — up to ₹750 on carts above ₹4,499' },
  ];
}
