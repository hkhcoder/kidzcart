import { Component } from '@angular/core';

export interface FooterLink {
  label: string;
  routerLink: string;
  queryParams?: Record<string, string>;
}

export interface FooterSection {
  title: string;
  icon: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent {
  /** Edit here to add/remove groups without touching the template. */
  readonly sections: FooterSection[] = [
    {
      title: 'Explore',
      icon: '🧭',
      links: [
        { label: 'Home sweet home', routerLink: '/' },
        { label: 'Shop goodies', routerLink: '/products' },
        { label: 'Our story', routerLink: '/about' },
      ],
    },
    {
      title: 'Share the love',
      icon: '💝',
      links: [
        { label: 'Donate something', routerLink: '/donate' },
        { label: 'Your profile', routerLink: '/profile' },
        { label: 'Cart', routerLink: '/cart' },
      ],
    },
    {
      title: 'Extra sparkle',
      icon: '✨',
      links: [
        { label: 'Achievements', routerLink: '/achievements' },
        { label: 'Checkout', routerLink: '/checkout' },
        { label: 'Sign in', routerLink: '/auth' },
      ],
    },
  ];

  readonly tagline = 'Made for families who love pre-loved treasures.';

  readonly currentYear = new Date().getFullYear();
}
