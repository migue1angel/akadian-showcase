import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {}
