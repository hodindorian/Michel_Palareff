import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mp_auth';
const VALID_USERNAME = 'michel';
const VALID_PASSWORD = 'palareff';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

  login(username: string, password: string): boolean {
    const ok = username.trim().toLowerCase() === VALID_USERNAME && password === VALID_PASSWORD;
    if (ok) {
      localStorage.setItem(STORAGE_KEY, 'true');
      this.isAuthenticated.set(true);
    }
    return ok;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.isAuthenticated.set(false);
  }
}
