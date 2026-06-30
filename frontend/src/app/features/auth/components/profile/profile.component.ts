import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';

import { AuthService } from '@core/auth/auth.service';
import { CustomLabelDirective } from '@shared/directives/custom-label.directive';
import { ErrorMessageDirective } from '@shared/directives/custom-error.directive';
import { ProfileFormEnum } from '@shared/enums/fields.enum';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [
    CustomLabelDirective,
    Fluid,
    ReactiveFormsModule,
    InputText,
    ErrorMessageDirective,
  ],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  protected readonly profileFormEnum = ProfileFormEnum;
  protected form!: FormGroup;
  public readonly outputProfile = output<{ firstName: string; lastName: string }>();

  constructor() {
    this.buildForm();
    this.trackFormChanges();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      email: [{ value: null, disabled: true }, [Validators.email]],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
    });
  }

  private trackFormChanges(): void {
    effect((onCleanup) => {
      if (!this.authService.user()) return;
      this.form.patchValue(this.authService.user()!);
    });

    effect((onCleanup) => {
      const sub = this.form.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(() => {
          if (this.form.invalid) return;
          const { firstName, lastName } = this.form.getRawValue();
          this.outputProfile.emit({ firstName, lastName });
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  get emailField(): AbstractControl {
    return this.form.controls['email'];
  }
  get firstNameField(): AbstractControl {
    return this.form.controls['firstName'];
  }
  get lastNameField(): AbstractControl {
    return this.form.controls['lastName'];
  }
}
