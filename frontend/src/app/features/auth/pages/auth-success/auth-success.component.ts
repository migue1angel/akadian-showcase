
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';

@Component({
  selector: 'app-auth-success',
  imports: [SpinnerComponent],
  templateUrl: './auth-success.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthSuccess implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.loadUserProfile().subscribe((success) => {
      if (!success) {
        this.router.navigateByUrl('/auth/login');
        return;
      }

      this.router.navigateByUrl('/');
    });
  }
}
