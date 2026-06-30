import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormUtils } from '../../core/utils/form.utils';

@Directive({
  selector: '[appErrorMessage]',
  standalone: true,
})
export class ErrorMessageDirective implements OnInit {
  private readonly el: ElementRef = inject(ElementRef);
  private element!: HTMLLabelElement;
  constructor() {
    this.element = this.el.nativeElement;
  }

  public errors = input<ValidationErrors | null | undefined>(null);
  public touched = input<boolean | undefined>(false);
  public dirty = input<boolean>(false);

  ngOnInit(): void {
    this.element = this.el.nativeElement;
  }

  setErrorMessage = effect(() => {
    const errors = this.errors();
    const touched = this.touched();
    const dirty = this.dirty();

    if (!this.element) return;

    if (!errors || !touched) {
      this.element.classList.add('hidden');
      return;
    }

    this.element.classList.remove('hidden');
    this.element.classList.add('text-primary', 'text-sm');

    const errorKeys = errors ? Object.keys(errors) : [];

    if (errorKeys.includes('required')) {
      this.element.innerText = 'Field required';
      return;
    }

    if (errorKeys.includes('minlength')) {
      const min = errors['minlength']['requiredLength'];
      const current = errors['minlength']['actualLength'];
      this.element.innerText = `${current}/${min} required characters`;
      return;
    }

    if (errorKeys.includes('minLengthArray')) {
      const min = errors['minLengthArray']['requiredLength'];
      const current = errors['minLengthArray']['actualLength'];
      this.element.innerText = `${current}/${min} minimum required elements`;
      return;
    }

    if (errorKeys.includes('email')) {
      this.element.innerText = 'Invalid email format';
      return;
    }
    if (errorKeys.includes('pattern')) {
      const requiredPattern = errors['pattern']['requiredPattern'];

      if (requiredPattern === FormUtils.passwordPattern) {
        this.element.innerText =
          'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#._-)';
      } else if (requiredPattern === FormUtils.phoneNumberPattern) {
        this.element.innerText = 'Invalid phone number format';
      } else if (requiredPattern === FormUtils.timePattern) {
        this.element.innerText = 'Invalid time format';
      } else {
        this.element.innerText = 'Invalid format';
      }

      return;
    }

    if (errorKeys.length > 0) {
      this.element.innerText = 'Invalid field';
    }
  });
}
