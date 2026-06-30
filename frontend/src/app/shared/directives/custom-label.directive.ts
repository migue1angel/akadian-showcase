import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';

@Directive({
  selector: '[appCustomLabel]',
})
export class CustomLabelDirective implements OnInit {
  public label = input<string>();
  public abstractControl = input<AbstractControl| null>();
  private readonly el: ElementRef = inject(ElementRef);
  private readonly element!: HTMLLabelElement;
  constructor() {
    this.element = this.el.nativeElement;
  }
  ngOnInit(): void {
    this.setLabel();
  }
  setLabel() {
    this.element.classList.add('font-semibold');

    let labelText = `${this.label()}`;
    // const control = this.abstractControl();
    // let isRequired = false;
    // if (control && control.validator) {
    //   const validator = control.validator({} as AbstractControl);
    //   isRequired = !!(validator && validator['required']);
    // }

    this.element.innerHTML = this.abstractControl()?.hasValidator(
      Validators.required
    )
      ? `${labelText}: <span style="color: red">*</span>`
      : `${labelText}:`;
  }
}
