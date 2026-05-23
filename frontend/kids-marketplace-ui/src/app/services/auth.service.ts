import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

import { ApiService } from './api.service';
import { User } from '../models/user';

type SignupRequest = { name: string; email: string; password: string };
type LoginRequest = { email: string; password: string };

type AuthResponse = { user: User; token: string };

const LS_TOKEN_KEY = 'km_token';
const LS_USER_KEY = 'km_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(this.loadToken());
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());

  public readonly token$ = this.tokenSubject.asObservable();
  public readonly user$ = this.userSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  private loadToken(): string | null {
    try {
      return localStorage.getItem(LS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get user(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  get userId(): string | null {
    return this.user?.id ?? null;
  }

  async signup(req: SignupRequest): Promise<AuthResponse> {
    const res = await this.api.post<AuthResponse>('/auth/signup', req);
    this.setAuth(res.user, res.token);
    return res;
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    const res = await this.api.post<AuthResponse>('/auth/login', req);
    this.setAuth(res.user, res.token);
    return res;
  }

  async fetchMe(): Promise<{ user: User; coupons: any[] }> {
    const token = this.token;
    const res = await this.api.get<{ user: User; coupons: any[] }>('/users/me', token);
    this.userSubject.next(res.user);
    // Keep user in storage
    try {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(res.user));
    } catch {
      // ignore
    }
    return res;
  }

  logout(): void {
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    try {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem('km_latest_coupon');
    } catch {
      // ignore
    }
    this.router.navigate(['/']);
  }

  private setAuth(user: User, token: string): void {
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    try {
      localStorage.setItem(LS_TOKEN_KEY, token);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }
}

