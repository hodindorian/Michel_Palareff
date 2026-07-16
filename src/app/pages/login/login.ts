import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

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

  readonly username = signal('');
  readonly password = signal('');
  readonly error = signal(false);

  submit(): void {
    const ok = this.auth.login(this.username(), this.password());
    if (!ok) {
      this.error.set(true);
      return;
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/feed';
    this.router.navigateByUrl(returnUrl);
  }
}
