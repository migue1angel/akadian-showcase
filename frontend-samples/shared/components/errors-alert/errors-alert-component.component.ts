import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CustomMessageService } from '../../../core/services/custom-message.service';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-errors-alert-component',
  imports: [Toast],
  templateUrl: './errors-alert-component.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorsAlertComponentComponent {
  protected readonly customMessageService = inject(CustomMessageService);
  protected readonly Array = Array;

}
