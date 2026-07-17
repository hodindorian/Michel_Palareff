import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<Mode>('login');
  readonly username = signal('');
  readonly password = signal('');
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.error.set(null);
  }

  submit(): void {
    if (this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const request =
      this.mode() === 'login'
        ? this.auth.login(this.username(), this.password())
        : this.auth.register(this.username(), this.password());

    request.subscribe((result) => {
      this.loading.set(false);
      if (!result.ok) {
        this.error.set(result.error);
        return;
      }
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/feed';
      this.router.navigateByUrl(returnUrl);
    });
  }
}
