import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Location } from '@angular/common';
import { Button } from 'primeng/button';
import { BulkAttendanceComponent } from '@features/attendance-evaluation/pages/bulk-attendance/bulk-attendance.component';
import { BulkEvaluationComponent } from '@features/attendance-evaluation/pages/bulk-evaluation/bulk-evaluation.component';

type UserRole = 'tutor' | 'coordinator';

@Component({
  selector: 'app-attendance-evaluation',
  imports: [TabsModule, BulkAttendanceComponent, BulkEvaluationComponent, Button],
  templateUrl: './attendance-evaluation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceEvaluationComponent {
  protected readonly location = inject(Location);
  
  // Input properties for role-based configuration
  userRole = input.required<UserRole>();
  classSessionId = input.required<string>();
  courseId = input.required<string>();
}
