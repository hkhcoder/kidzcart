import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function springBodyMessage(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === 'string' && body.trim()) {
    return body.length < 800 ? body.trim() : null;
  }
  if (typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const pick = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim() : null;
  const msg =
    pick(b['message']) ??
    pick(b['detail']) ??
    pick(b['title']) ??
    pick(b['error']);
  if (msg) return msg;
  const errs = b['errors'];
  if (Array.isArray(errs)) {
    const parts = errs
      .map((e) => {
        if (e && typeof e === 'object') {
          const o = e as Record<string, unknown>;
          const d = pick(o['defaultMessage']);
          const f = pick(o['field']);
          if (d && f) return `${f}: ${d}`;
          return d ?? f ?? null;
        }
        return null;
      })
      .filter((x): x is string => !!x);
    if (parts.length) return parts.join('; ');
  }
  return null;
}

function messageFromHttpError(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const status = err.status;

  if (status === 0) {
    return 'Cannot reach the API. Start the dev proxy targets (auth Java on 4001, product API on 4002), then try again.';
  }
  if (status === 502 || status === 503) {
    return 'KidzCart API is unavailable. Is the Java marketplace-service running on port 4001?';
  }
  if (status === 401) {
    const m = springBodyMessage(err.error);
    if (m) return m;
    return 'Invalid email or password.';
  }

  const fromBody = springBodyMessage(err.error);
  if (fromBody) return fromBody;

  if (status >= 500) {
    return 'Server error while signing in. If this persists, check that MySQL is running and db/kids_marketplace_mysql_init.sql was applied.';
  }
  return null;
}

type FieldName = 'name' | 'email' | 'password';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy {
  mode: 'login' | 'signup' = 'login';
  loading = false;
  error: string | null = null;

  readonly authForm: FormGroup;

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder) {
    this.authForm = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.applyModeValidators();
  }

  ngOnDestroy(): void {
  }

  switchMode(m: 'login' | 'signup'): void {
    this.mode = m;
    this.error = null;
    if (m === 'login') {
      this.authForm.patchValue({ name: '' }, { emitEvent: false });
    }
    this.applyModeValidators();
  }

  private applyModeValidators(): void {
    const name = this.authForm.get('name')!;
    const password = this.authForm.get('password')!;
    if (this.mode === 'signup') {
      name.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ]);
      password.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      name.clearValidators();
      password.setValidators([Validators.required]);
    }
    name.updateValueAndValidity({ emitEvent: false });
    password.updateValueAndValidity({ emitEvent: false });
  }

  private trimFields(): void {
    const email = (this.authForm.get('email')!.value ?? '').toString().trim();
    this.authForm.patchValue({ email }, { emitEvent: false });
    if (this.mode === 'signup') {
      const name = (this.authForm.get('name')!.value ?? '').toString().trim();
      this.authForm.patchValue({ name }, { emitEvent: false });
    }
  }

  showFieldError(field: FieldName): boolean {
    const c = this.authForm.get(field);
    if (!c) return false;
    return c.invalid && (c.dirty || c.touched);
  }

  fieldMessage(field: FieldName): string {
    const c = this.authForm.get(field);
    if (!c?.errors || !this.showFieldError(field)) return '';

    const e = c.errors;
    if (e['required']) {
      if (field === 'name') return 'Please enter your full name.';
      if (field === 'email') return 'Please enter your email.';
      return 'Please enter your password.';
    }
    if (e['email']) return 'Enter a valid email address (e.g. you@example.com).';
    if (e['minlength']) {
      const min = (e['minlength'] as { requiredLength: number }).requiredLength;
      if (field === 'name') return `Name must be at least ${min} characters.`;
      return `Password must be at least ${min} characters.`;
    }
    if (e['maxlength']) {
      const max = (e['maxlength'] as { requiredLength: number }).requiredLength;
      return `Name must be at most ${max} characters.`;
    }
    return '';
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  async submit(): Promise<void> {
    this.trimFields();
    this.error = null;
    this.authForm.markAllAsTouched();

    if (this.authForm.invalid) {
      return;
    }

    const v = this.authForm.getRawValue() as { name: string; email: string; password: string };
    this.loading = true;
    try {
      if (this.mode === 'signup') {
        await this.auth.signup({
          name: v.name,
          email: v.email,
          password: v.password,
        });
      } else {
        await this.auth.login({
          email: v.email,
          password: v.password,
        });
      }
      await this.router.navigate(['/profile']);
    } catch (e: unknown) {
      this.error =
        messageFromHttpError(e) ??
        (e instanceof Error ? e.message : null) ??
        'Authentication failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
