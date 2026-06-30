import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { AuthService } from '@core/auth/auth.service';
import { ErrorMessageDirective } from '@shared/directives/custom-error.directive';
import { CustomLabelDirective } from '@shared/directives/custom-label.directive';
import { AuthFormEnum } from '@shared/enums/fields.enum';
import { Password } from 'primeng/password';
import { ROUTES } from '@shared/constants/routing.constants';
import { NotificationService } from '@core/services/ui/notification.service';

@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputText,
    Button,
    Password,
    CustomLabelDirective,
    ErrorMessageDirective,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly AuthFormEnum = AuthFormEnum;
  protected readonly loading = signal(false);

  protected loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.authService.loadUserProfile().subscribe(() => {
          const returnUrl =
            this.route.snapshot.queryParams['returnUrl'] || ROUTES.DASHBOARD;
          this.router.navigateByUrl(returnUrl);
        });
      },
      error: (error) => {
        this.loading.set(false);
        if (error.status !== 429) {
          this.notificationService.showError(
            'Login Failed',
            error.error?.message || 'Invalid email or password',
          );
        }
      },
    });
  }

  get emailField() {
    return this.loginForm.get('email')!;
  }

  get passwordField() {
    return this.loginForm.get('password')!;
  }
}
