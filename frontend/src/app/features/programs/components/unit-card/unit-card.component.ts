import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Unit } from 'src/app/features/programs/interfaces/unit.interface';
import { UnitsHttpService } from 'src/app/features/programs/services/units-http.service';
import { AccordionModule } from 'primeng/accordion';
import { map } from 'rxjs';

@Component({
  selector: 'app-unit-card',
  imports: [AccordionModule],
  templateUrl: './unit-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitCardComponent {
  private readonly unitsHttpService = inject(UnitsHttpService);
  public unit = input<Unit>();
  public unitId = input<string>();

  protected unitResource = rxResource({
    params: this.unitId,
    stream: ({ params: unitId }) =>
      this.unitsHttpService.findOne(unitId).pipe(map((res) => res.data)),
  });

  protected displayUnit = computed(() => {
    return this.unitResource.value() ?? this.unit() ?? null;
  });
}
