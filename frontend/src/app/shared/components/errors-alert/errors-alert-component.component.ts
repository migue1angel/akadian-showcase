import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { NotificationService } from '@core/services/ui/notification.service';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-errors-alert-component',
  imports: [Toast],
  templateUrl: './errors-alert-component.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorsAlertComponentComponent {
  protected readonly customMessageService = inject(NotificationService);
  protected readonly Array = Array;

}
