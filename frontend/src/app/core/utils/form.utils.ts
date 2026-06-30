import {
  AbstractControl,
  FormArray,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export class FormUtils {
  static emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

  static passwordPattern =
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#._-])[A-Za-z\\d@$!%*?&#._-]{8,}$';
  static timePattern = '^([01]\\d|2[0-3]):[0-5]\\d$';
  static phoneNumberPattern = '^[0-9]{9}$';

  static isFieldOneEqualFieldTwo(field1: string, field2: string) {
    return (formGroup: AbstractControl) => {
      const field1Value = formGroup.get(field1)?.value;
      const field2Value = formGroup.get(field2)?.value;

      return field1Value === field2Value ? null : { passwordsNotEqual: true };
    };
  }

  static minFormArrayLength(min: number): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      if (formArray instanceof FormArray && formArray.length < min) {
        return {
          minLengthArray: {
            requiredLength: min,
            actualLength: formArray.length,
          },
        };
      }
      return null;
    };
  }
}
