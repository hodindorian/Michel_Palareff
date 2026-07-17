import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

export type AuthResult = { ok: true } | { ok: false; error: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly username = signal<string | null>(null);

  private request(
    url: string,
    body: { username: string; password: string },
  ): Observable<AuthResult> {
    return this.http.post<{ username: string }>(url, body, { withCredentials: true }).pipe(
      tap((res) => this.username.set(res.username)),
      map((): AuthResult => ({ ok: true })),
      catchError((err: HttpErrorResponse) =>
        of<AuthResult>({ ok: false, error: err.error?.error ?? 'Une erreur est survenue.' }),
      ),
    );
  }

  register(username: string, password: string): Observable<AuthResult> {
    return this.request('/api/auth/register', { username, password });
  }

  login(username: string, password: string): Observable<AuthResult> {
    return this.request('/api/auth/login', { username, password });
  }

  checkSession(): Observable<boolean> {
    return this.http.get<{ username: string }>('/api/auth/me', { withCredentials: true }).pipe(
      tap((res) => this.username.set(res.username)),
      map(() => true),
      catchError(() => {
        this.username.set(null);
        return of(false);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.username.set(null)));
  }
}
