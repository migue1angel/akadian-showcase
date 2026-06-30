import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
} from '@angular/core';
import { ProgramFormComponent } from '../../components/program-form/program-form.component';
import { UnitClassCardComponent } from '../../components/unit-class-card/unit-class-card.component';
import { Program } from 'src/app/features/programs/interfaces/program.interface';
import { ActivatedRoute } from '@angular/router';
import { ProgramsHttpService } from '../../services/programs-http.service';

@Component({
  selector: 'app-new-program',
  imports: [ProgramFormComponent, UnitClassCardComponent],
  templateUrl: './new-program.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewProgramComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly programsHttpService = inject(ProgramsHttpService);

  newProgram = signal<Program | null>(null);
  currentUnit = signal<number>(0);
  programId = this.route.snapshot.paramMap.get('id');

  constructor() {
    if (this.programId) {
      this.programsHttpService.loadProgram(this.programId);
    } else {
      this.programsHttpService.selectedProgramId.set(undefined);
    }
  }

  protected initialProgramResource = this.programsHttpService.programResource;

  onFormChange(program: Program) {
    this.newProgram.set(program);
  }

  onCurrentUnitChange(index: number) {
    this.currentUnit.set(index);
  }
}
