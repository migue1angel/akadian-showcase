import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  output,
  signal,
  input,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CatalogueModel } from '@core/models/catalogue.model';
import { CataloguesService } from '@core/services/catalogues.service';
import { NotificationService } from '@core/services/ui/notification.service';

import { CustomLabelDirective } from '@shared/directives/custom-label.directive';
import { ErrorMessageDirective } from '@shared/directives/custom-error.directive';
import { CataloguesEnum } from '@shared/enums/catalogues.enum';
import {
  ProgramFormEnum,
  UnitClassFormEnum,
  UnitFormEnum,
} from '@shared/enums/fields.enum';

import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';

import { Program } from '@features/programs/interfaces/program.interface';
import { ProgramsHttpService } from '@features/programs/services/programs-http.service';

@Component({
  selector: 'program-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomLabelDirective,
    ErrorMessageDirective,
    Button,
    Fluid,
    InputNumber,
    InputText,
    Select,
    Textarea,
  ],
  templateUrl: './program-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cataloguesService = inject(CataloguesService);
  private readonly notificationService = inject(NotificationService);
  private readonly programsHttpService = inject(ProgramsHttpService);

  protected readonly ProgramFormEnum = ProgramFormEnum;
  protected readonly UnitFormEnum = UnitFormEnum;
  protected readonly UnitClassFormEnum = UnitClassFormEnum;

  protected currentUnitIndex = signal<number>(0);
  protected formOutput = output<Program>();
  protected currentUnitIndexOutput = output<number>();

  public initialData = input<Program | null>(null);

  protected form!: FormGroup;
  protected languages: CatalogueModel[] = [];
  protected levels: CatalogueModel[] = [];
  protected classTypes: CatalogueModel[] = [];

  ngOnInit(): void {
    this.loadCatalogues();
    this.buildForm();
  }

  private readonly patchFormData = effect(() => {
    const data = this.initialData();
    if (!data) return;

    this.form.patchValue({
      name: data.name,
      languageId: data.languageId,
      levelId: data.levelId,
      totalUnits: data.totalUnits,
      totalClasses: data.totalClasses || 0,
      minAttendancePercentage: data.minAttendancePercentage || 80,
      minPassPercentage: data.minPassPercentage || 70,
    });

    if (data.units && Array.isArray(data.units)) {
      this.unitsField.clear();
      data.units.forEach((unit: any, index: number) => {
        const unitForm = this.buildUnitForm(index + 1);
        unitForm.patchValue({
          unitNumber: unit.unitNumber,
          title: unit.name || unit.title,
          overview: unit.description || unit.overview,
        });

        if (unit.unitClasses && Array.isArray(unit.unitClasses)) {
          const unitClassesArray = unitForm.get('unitClasses') as FormArray;
          unitClassesArray.clear();
          unit.unitClasses.forEach((unitClass: any) => {
            const classTypeId = unitClass.type || unitClass.classTypeId;
            const classType = this.classTypes.find((ct) => ct.id === classTypeId);
            const unitClassForm = this.buildUnitClassForm(classType || { id: classTypeId } as any);
            unitClassForm.patchValue({
              classTypeId: classTypeId,
              title: unitClass.name || unitClass.title,
              description: unitClass.description || '',
            });
            unitClassesArray.push(unitClassForm);
          });
        }

        this.unitsField.push(unitForm);
      });
    }
  });

  private buildForm(): void {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      languageId: [null, [Validators.required]],
      levelId: [null, [Validators.required]],
      totalUnits: [0, [Validators.required, Validators.min(1)]],
      totalClasses: [null, [Validators.required]],
      minAttendancePercentage: [80, [Validators.required, Validators.max(100)]],
      minPassPercentage: [70, [Validators.required, Validators.max(100)]],
      units: this.fb.array([]),
    });
  }

  private buildUnitForm(unitNumber: number): FormGroup {
    const unitForm = this.fb.group({
      unitNumber: [unitNumber, [Validators.required]],
      title: [null, [Validators.required]],
      overview: [null, [Validators.required]],
      unitClasses: this.fb.array([]),
    });

    const unitClassesArray = unitForm.get('unitClasses') as FormArray;
    this.classTypes.forEach((classType) => {
      unitClassesArray.push(this.buildUnitClassForm(classType));
    });

    return unitForm;
  }

  private buildUnitClassForm(classType: CatalogueModel): FormGroup {
    return this.fb.group({
      classTypeId: [classType.id, [Validators.required]],
      title: [null],
      description: [null],
    });
  }

  private loadCatalogues(): void {
    const catalogues = this.cataloguesService.catalogues();

    this.levels = catalogues
      .filter((c) => c.type === CataloguesEnum.level)
      .sort((a, b) => a.orderSequence - b.orderSequence);

    this.languages = catalogues.filter(
      (c) => c.type === CataloguesEnum.language
    );
    this.classTypes = catalogues.filter(
      (c) => c.type === CataloguesEnum.classType
    );
  }

  onFormChangesEffect = effect((onCleanup) => {
    const formSubscription = this.form.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((value) => {
        this.formOutput.emit(value);
        this.currentUnitIndexOutput.emit(this.currentUnitIndex());
      });

    const totalUnitsSubscription = this.totalUnitsField.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: number) => {
        this.syncUnitsArray(value);
      });

    onCleanup(() => {
      formSubscription.unsubscribe();
      totalUnitsSubscription.unsubscribe();
    });
  });

  private syncUnitsArray(targetCount: number): void {
    const unitsArray = this.unitsField;
    const currentCount = unitsArray.length;
    const validTargetCount = Math.max(0, targetCount);

    if (validTargetCount > currentCount) {
      for (let i = currentCount; i < validTargetCount; i++) {
        unitsArray.push(this.buildUnitForm(i + 1));
      }
    } else if (validTargetCount < currentCount) {
      for (let i = currentCount - 1; i >= validTargetCount; i--) {
        unitsArray.removeAt(i);
      }
    }

    if (this.currentUnitIndex() >= validTargetCount) {
      this.currentUnitIndex.set(Math.max(0, validTargetCount - 1));
    }
  }

  goToPreviousUnit(): void {
    this.currentUnitIndex.update((index) => Math.max(0, index - 1));
    this.emitFormState();
  }

  goToNextUnit(): void {
    const maxIndex = this.unitsField.length - 1;
    this.currentUnitIndex.update((index) => Math.min(maxIndex, index + 1));
    this.emitFormState();
  }

  private emitFormState(): void {
    this.formOutput.emit(this.form.value);
    this.currentUnitIndexOutput.emit(this.currentUnitIndex());
  }

  onSubmit(): void {
    if (this.form.valid) {
      const id = this.initialData()?.id;
      if (id) {
        this.updateProgram(id);
      } else {
        this.createProgram();
      }
    } else {
      this.form.markAllAsTouched();
      this.showFormErrors();
    }
  }

  private mapFormToDto(formValue: any): any {
    return {
      name: formValue.name,
      description: formValue.description || '',
      totalUnits: Number(formValue.totalUnits),
      isActive: true,
      languageId: formValue.languageId,
      levelId: formValue.levelId,
      units: (formValue.units || []).map((unit: any, uIdx: number) => ({
        unitNumber: uIdx + 1,
        name: unit.title || `Unit ${uIdx + 1}`,
        description: unit.overview || '',
        unitClasses: (unit.unitClasses || [])
          .filter((uc: any) => uc.title)
          .map((uc: any, cIdx: number) => ({
            classNumber: cIdx + 1,
            name: uc.title,
            type: uc.classTypeId,
          })),
      })),
    };
  }

  private createProgram(): void {
    const program = this.mapFormToDto(this.form.value);
    this.programsHttpService.createProgram(program).subscribe({
      next: () => {
        this.notificationService.showSuccess('Program created successfully');
        this.router.navigate(['coordinator/programs/list']);
      },
      error: (error) => this.handleError(error),
    });
  }

  private updateProgram(id: string): void {
    const program = this.mapFormToDto(this.form.value);
    this.programsHttpService.update(id, program).subscribe({
      next: () => {
        this.notificationService.showSuccess('Program updated successfully');
        this.router.navigate(['coordinator/programs/list']);
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: any): void {
    Array.isArray(error.error.message)
      ? this.notificationService.showErrors(error.error.message)
      : this.notificationService.showError(error.error.message);
  }

  private showFormErrors(): void {
    const errors = this.collectFormErrors();
    if (errors.length) {
      this.notificationService.showErrors(errors);
    }
  }

  private collectFormErrors(): string[] {
    const errors: string[] = [];
    this.validateMainFields(errors);
    this.validateUnits(errors);
    return errors;
  }

  private validateMainFields(errors: string[]): void {
    const fieldValidations = [
      { field: this.nameField, message: 'Name is required.' },
      { field: this.languageField, message: 'Language is required.' },
      { field: this.levelField, message: 'Level is required.' },
      {
        field: this.totalUnitsField,
        message: 'Total units must be greater than 0.',
      },
      { field: this.totalClassesField, message: 'Total classes is required.' },
      {
        field: this.minAttendancePercentageField,
        message: 'Minimum attendance percentage is invalid.',
      },
      {
        field: this.minPassPercentageField,
        message: 'Minimum pass percentage is invalid.',
      },
    ];

    fieldValidations.forEach(({ field, message }) => {
      if (field.invalid) {
        errors.push(message);
      }
    });
  }

  private validateUnits(errors: string[]): void {
    this.unitsField.controls.forEach((unitControl, index) => {
      const unitGroup = unitControl as FormGroup;
      this.validateUnit(unitGroup, index, errors);
    });
  }

  private validateUnit(
    unitGroup: FormGroup,
    index: number,
    errors: string[]
  ): void {
    const title = unitGroup.get('title');
    const overview = unitGroup.get('overview');

    if (title?.invalid) {
      errors.push(`Unit ${index + 1}: title is required.`);
    }

    if (overview?.invalid) {
      errors.push(`Unit ${index + 1}: overview is required.`);
    }

    const unitClasses = unitGroup.get('unitClasses') as FormArray;
    unitClasses?.controls.forEach((classControl, classIndex) => {
      const classTypeId = (classControl as FormGroup).get('classTypeId');
      if (classTypeId?.invalid) {
        errors.push(
          `Unit ${index + 1} - Class ${classIndex + 1}: class type is required.`
        );
      }
    });
  }

  get nameField(): AbstractControl {
    return this.form.get('name')!;
  }

  get languageField(): AbstractControl {
    return this.form.get('languageId')!;
  }

  get levelField(): AbstractControl {
    return this.form.get('levelId')!;
  }

  get totalUnitsField(): AbstractControl {
    return this.form.get('totalUnits')!;
  }

  get totalClassesField(): AbstractControl {
    return this.form.get('totalClasses')!;
  }

  get minAttendancePercentageField(): AbstractControl {
    return this.form.get('minAttendancePercentage')!;
  }

  get minPassPercentageField(): AbstractControl {
    return this.form.get('minPassPercentage')!;
  }

  get unitsField(): FormArray {
    return this.form.get('units') as FormArray;
  }

  getCurrentUnitFormGroup(): FormGroup | null {
    const index = this.currentUnitIndex();
    const control = this.unitsField.at(index);
    return control instanceof FormGroup ? control : null;
  }

  getCurrentUnitClassesField(): FormArray | null {
    const unitForm = this.getCurrentUnitFormGroup();
    if (!unitForm) return null;
    const control = unitForm.get('unitClasses');
    return control instanceof FormArray ? control : null;
  }
}
