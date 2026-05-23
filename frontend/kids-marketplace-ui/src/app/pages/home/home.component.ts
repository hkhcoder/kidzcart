import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

export interface HeroSlide {
  src: string;
  alt: string;
  routerLink: string;
  queryParams?: Record<string, string>;
}

export interface HomeCategoryTile {
  title: string;
  imageSrc: string;
  routerLink: string;
  queryParams?: Record<string, string>;
  id: 'books' | 'toys' | 'clothes';
  ribbon?: { kind: 'new' | 'sale'; label: string };
}

export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
}

export interface HomeReview {
  name: string;
  title: string;
  quote: string;
  rating: number;
  source: string;
}

export interface PlayBubble {
  id: string;
  leftPct: number;
  topPct: number;
  size: number;
  color: string;
  delay: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private readonly heroIntervalMs = 6000;
  heroPaused = false;

  heroIndex = 0;
  readonly heroSlides: HeroSlide[] = [
    {
      src: 'assets/banners/63.png',
      alt: 'KidzCart — play, grow, and dress in joy',
      routerLink: '/products',
    },
    {
      src: 'assets/banners/toys_banner.jpg',
      alt: 'Toys for curious kids',
      routerLink: '/products',
      queryParams: { category: 'toys' },
    },
    {
      src: 'assets/banners/clothes_banner.webp',
      alt: 'Clothes and comfy outfits',
      routerLink: '/products',
      queryParams: { category: 'clothes' },
    },
  ];

  /** Chip selection: all | category id */
  selectedChip: 'all' | 'books' | 'toys' | 'clothes' = 'all';

  readonly shopCategoryTiles: HomeCategoryTile[] = [
    {
      id: 'books',
      title: 'Books',
      imageSrc: 'assets/banners/53.jpg',
      routerLink: '/products',
      queryParams: { category: 'books' },
    },
    {
      id: 'clothes',
      title: 'Clothes',
      imageSrc: 'assets/banners/60.jpg',
      routerLink: '/products',
      queryParams: { category: 'clothes' },
    },
    {
      id: 'toys',
      title: 'Toys',
      imageSrc: 'assets/banners/54.jpg',
      routerLink: '/products',
      queryParams: { category: 'toys' },
      ribbon: { kind: 'new', label: 'New' },
    },
  ];

  readonly faqs: HomeFaq[] = [
    {
      id: 'faq-1',
      question: 'What is KidzCart?',
      answer:
        'KidzCart is a friendly place for families to find pre-loved books, toys, and clothes — and to share items with others. Shopping here is designed as a learning experience with grown-ups nearby.',
    },
    {
      id: 'faq-2',
      question: 'How do donations work?',
      answer:
        'You can list items you would like to donate from the Donate page. In this demo, donations are approved automatically, and you may receive a thank-you coupon for helping the community.',
    },
    {
      id: 'faq-3',
      question: 'Is checkout real?',
      answer:
        'Checkout is a pretend flow for learning: review your cart, apply coupons if you have them, and practice safe habits with a parent or guardian.',
    },
  ];

  readonly customerReviews: HomeReview[] = [
    {
      name: 'Maya S.',
      title: 'Parent of two',
      quote: 'So many thoughtful picks for my preschooler. The site feels playful and easy to shop with my little one.',
      rating: 5,
      source: 'Verified family shopper',
    },
    {
      name: 'Noah R.',
      title: 'Grandparent',
      quote: 'I loved the friendly layout and the helpful product categories. Checkout was simple and reassuring.',
      rating: 5,
      source: 'Trusted reviewer',
    },
    {
      name: 'Ava P.',
      title: 'Mom & educator',
      quote: 'The reviews and quality notes made choosing a gift much faster. This feels like a real community shop.',
      rating: 5,
      source: 'KidzCart community',
    },
    {
      name: 'Leo K.',
      title: 'Dad',
      quote: 'A bright, calming experience — and my kids immediately wanted to browse more. We’ll be back for more books and toys.',
      rating: 4,
      source: 'Family favorite',
    },
  ];

  reviewIndex = 0;
  reviewPaused = false;
  private reviewTimer: ReturnType<typeof setInterval> | null = null;
  private readonly reviewIntervalMs = 5000;

  openFaqId: string | null = 'faq-1';

  confettiActive = false;

  /** For *ngFor confetti pieces (indices) */
  readonly confettiIndices = Array.from({ length: 14 }, (_, i) => i);

  readonly didYouKnowTips: string[] = [
    'Did you know? Reading together for 10 minutes a day builds huge habits.',
    'Did you know? Gently used toys can find a second home and a new smile.',
    'Did you know? Swapping clothes grows with your child — and the planet says thanks.',
    'Did you know? KidzCart is built for learning — always shop with a grown-up nearby.',
  ];

  currentTip = '';

  /** Touch-friendly bubble pop — Movement & play */
  playBubbles: PlayBubble[] = [];
  poppingBubbleIds: string[] = [];
  bubblePopCount = 0;
  reduceMotionPlay = false;

  ngOnInit(): void {
    this.reduceMotionPlay =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.playBubbles = this.buildPlayBubbles();
    this.currentTip = this.didYouKnowTips[Math.floor(Math.random() * this.didYouKnowTips.length)];
    this.startHeroTimer();
    this.startReviewTimer();
    const key = 'kidzcart-home-visited';
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      this.triggerConfetti();
    }
  }

  ngOnDestroy(): void {
    this.clearHeroTimer();
    this.clearReviewTimer();
  }

  private startHeroTimer(): void {
    this.clearHeroTimer();
    this.heroTimer = setInterval(() => {
      if (!this.heroPaused) {
        this.heroIndex = (this.heroIndex + 1) % this.heroSlides.length;
      }
    }, this.heroIntervalMs);
  }

  private clearHeroTimer(): void {
    if (this.heroTimer != null) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  private startReviewTimer(): void {
    this.clearReviewTimer();
    this.reviewTimer = setInterval(() => {
      if (!this.reviewPaused) {
        this.reviewIndex = (this.reviewIndex + 1) % this.customerReviews.length;
      }
    }, this.reviewIntervalMs);
  }

  private clearReviewTimer(): void {
    if (this.reviewTimer != null) {
      clearInterval(this.reviewTimer);
      this.reviewTimer = null;
    }
  }

  pauseReviewRotation(): void {
    this.reviewPaused = true;
  }

  resumeReviewRotation(): void {
    this.reviewPaused = false;
  }

  selectReview(index: number): void {
    this.reviewIndex = index % this.customerReviews.length;
    this.reviewPaused = true;
  }

  goToSlide(i: number): void {
    const n = this.heroSlides.length;
    this.heroIndex = ((i % n) + n) % n;
    this.clearHeroTimer();
    this.startHeroTimer();
  }

  pauseHero(): void {
    this.heroPaused = true;
  }

  resumeHero(): void {
    this.heroPaused = false;
  }

  onDotsKeydown(event: KeyboardEvent, i: number): void {
    const n = this.heroSlides.length;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.goToSlide(i + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.goToSlide(i - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.goToSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.goToSlide(n - 1);
    }
  }

  selectChip(cat: 'all' | 'books' | 'toys' | 'clothes'): void {
    this.selectedChip = cat;
    if (cat === 'all') {
      document.getElementById('shop-cats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    document.getElementById(`shop-cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  onCategoryTileActivate(cat: 'books' | 'toys' | 'clothes'): void {
    this.selectedChip = cat;
  }

  trackBubbleId(_index: number, b: PlayBubble): string {
    return b.id;
  }

  isBubblePopping(id: string): boolean {
    return this.poppingBubbleIds.includes(id);
  }

  popBubble(id: string): void {
    if (this.poppingBubbleIds.includes(id)) {
      return;
    }
    if (!this.playBubbles.some((b) => b.id === id)) {
      return;
    }
    this.poppingBubbleIds = [...this.poppingBubbleIds, id];
    this.bubblePopCount += 1;
    window.setTimeout(() => {
      this.playBubbles = this.playBubbles.filter((b) => b.id !== id);
      this.poppingBubbleIds = this.poppingBubbleIds.filter((x) => x !== id);
    }, 430);
  }

  resetPlayBubbles(): void {
    this.poppingBubbleIds = [];
    this.bubblePopCount = 0;
    this.playBubbles = this.buildPlayBubbles();
  }

  private buildPlayBubbles(): PlayBubble[] {
    const palette = [
      '#7dd3fc',
      '#fda4af',
      '#fde047',
      '#86efac',
      '#c4b5fd',
      '#67e8f9',
      '#fbbf24',
      '#f472b6',
      '#a5b4fc',
      '#6ee7b7',
    ];
    const n = 14;
    const out: PlayBubble[] = [];
    for (let i = 0; i < n; i++) {
      out.push({
        id: `pb-${i}-${Math.random().toString(36).slice(2, 9)}`,
        leftPct: 3 + Math.random() * 82,
        topPct: 4 + Math.random() * 70,
        size: 38 + Math.floor(Math.random() * 34),
        color: palette[i % palette.length],
        delay: this.reduceMotionPlay ? 0 : Math.random() * 2200,
      });
    }
    return out;
  }

  toggleFaq(id: string): void {
    this.openFaqId = this.openFaqId === id ? null : id;
  }

  triggerConfetti(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    this.confettiActive = true;
    window.setTimeout(() => {
      this.confettiActive = false;
    }, 2200);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const t = event.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      return;
    }
    if (event.key === 'Escape' && this.openFaqId !== null) {
      this.openFaqId = null;
    }
  }

  get currentReview(): HomeReview | null {
    return this.customerReviews.length ? this.customerReviews[this.reviewIndex] : null;
  }

  getStars(count: number): string {
    return '★'.repeat(count).padEnd(5, '☆');
  }
}
