import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { CatalogueModel } from '@core/models/catalogue.model';
import { CataloguesService } from '@core/services/catalogues.service';
import { CataloguesEnum } from '@shared/enums/catalogues.enum';
import { Program } from 'src/app/features/programs/interfaces/program.interface';
import { Unit, UnitClass } from 'src/app/features/programs/interfaces/unit.interface';

@Component({
  selector: 'unit-class-card',
  imports: [],
  templateUrl: './unit-class-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitClassCardComponent implements OnInit {
  private readonly cataloguesService = inject(CataloguesService);
  unitClassInput = input<UnitClass | null>();
  unit = input<Unit | null>();
  program = input<Program | null>();
  classTypes: CatalogueModel[] = [];

  ngOnInit(): void {
    this.classTypes = this.cataloguesService
      .catalogues()
      .filter((catalogue) => catalogue.type === CataloguesEnum.classType);
  }
  unitClass = computed(() => {
    const inputValue = this.unitClassInput();
    if (!inputValue) return null;

    const foundType = this.classTypes.find(
      (c) => c.id === inputValue.classTypeId
    );
    return {
      ...inputValue,
      classType: foundType ?? undefined,
    };
  });
}
