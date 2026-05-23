import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/** Decorative icons — reference layout similar to kidzon.co trust row (external CDN images). */
@Component({
  selector: 'app-trust-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-strip.component.html',
  styleUrls: ['./trust-strip.component.scss'],
})
export class TrustStripComponent {
  readonly items = [
    {
      title: 'Free Shipping',
      sub: 'On qualifying carts — enjoy shopping without extra delivery worry.',
      image:
        'https://kidzon.co/cdn/shop/files/Artboard_1_2x_aafcd1e9-be9e-4a98-b6eb-89bbc8aab7d8.png?v=1682520336&width=320',
    },
    {
      title: 'Hassle-Free Returns',
      sub: 'Changed your mind? We keep returns straightforward and stress-free.',
      image:
        'https://kidzon.co/cdn/shop/files/Artboard_2_2x_c9c9d576-41cf-421e-a370-ed8cb7f57056.png?v=1682520336&width=320',
    },
    {
      title: 'Customer Support',
      sub: 'Friendly help when you need it — questions about orders or donations.',
      image:
        'https://kidzon.co/cdn/shop/files/Artboard_4_2x_6f821f7d-57ed-45e5-a552-adee53636822.png?v=1682585043&width=320',
    },
  ] as const;
}
