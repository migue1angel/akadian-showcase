import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ErrorsAlertComponentComponent } from '@shared/components/errors-alert/errors-alert-component.component';
import { LoadingService } from '@core/services/ui/loading.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-main-layout',
  imports: [
    NavbarComponent,
    RouterOutlet,
    ErrorsAlertComponentComponent,
    SpinnerComponent,
  ],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly layoutService = inject(LoadingService);

  ngOnInit(): void {
    this.trackNavigationLoading();
  }

  private trackNavigationLoading(): void {
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.layoutService.showSpinner();
        } else {
          this.layoutService.hideSpinner();
        }
      });
  }
}
