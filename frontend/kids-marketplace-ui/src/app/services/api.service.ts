import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  /** JSON body only for POST; avoids sending Content-Type on GET (avoids extra CORS preflight). */
  private buildHeaders(token?: string | null, jsonBody = false): HttpHeaders {
    let headers = new HttpHeaders();
    if (jsonBody) {
      headers = headers.set('content-type', 'application/json');
    }
    if (token) {
      headers = headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }

  async get<T>(path: string, token?: string | null, params?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = this.buildHeaders(token, false);
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== '') {
          httpParams = httpParams.set(key, value);
        }
      }
    }
    return await firstValueFrom(this.http.get<T>(url, { headers, params: httpParams }));
  }

  /** Binary or non-JSON GET (e.g. downloadable PDF certificate). */
  async getBlob(path: string, token?: string | null): Promise<Blob> {
    const url = `${API_BASE_URL}${path}`;
    const headers = this.buildHeaders(token, false);
    return await firstValueFrom(this.http.get(url, { headers, responseType: 'blob' }));
  }

  async post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = this.buildHeaders(token, true);
    return await firstValueFrom(this.http.post<T>(url, body, { headers }));
  }

  async patch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = this.buildHeaders(token, true);
    return await firstValueFrom(this.http.patch<T>(url, body, { headers }));
  }
}

