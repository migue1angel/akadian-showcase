import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { ColumnModel } from '@core/models/column.model';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { CourseItem } from '@features/courses/interfaces';
import { Router } from '@angular/router';
import { CoursesHttpService } from '@features/courses/services/courses-http.service';
import { AuthService } from '@features/auth/services/auth.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { RolesEnum } from '@shared/enums/roles.enum';

@Component({
  selector: 'app-course-list',
  imports: [TableModule, Button, Menu],
  templateUrl: './course-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly coursesHttpService = inject(CoursesHttpService);

  // Input properties for role-based configuration
  userRole = input.required<RolesEnum.coordinator | RolesEnum.tutor>();
  userId = input<string>();
  showEditAction = input<boolean>(false);
  showDeleteAction = input<boolean>(false);
  basePath = input<string>('');

  protected selectedItem = signal<CourseItem | null>(null);

  coursesResource = rxResource({
    params: () => ({ role: this.userRole(), userId: this.userId() }),
    stream: ({ params }) => {
      if (params.role === 'tutor') {
        // For tutor, load courses by tutor ID
        const tutorId = this.authService.user()?.tutor?.id;
        if (!tutorId) return of([]);
        return this.coursesHttpService
          .findByTutor(tutorId)
          .pipe(map((response) => response.data));
      } else {
        // For coordinator, use all courses
        return this.coursesHttpService
          .findAllList({ page: 1, limit: 1000 })
          .pipe(map((response) => response.data));
      }
    },
  });

  cols: ColumnModel[] = [
    { field: 'name', header: 'Program Name' },
    { field: 'timeSlot', header: 'Time Slot' },
    { field: 'timezone', header: 'Timezone' },
    { field: 'isActive', header: 'Is Active' },
    { field: 'days', header: 'Days' },
    { field: 'scheduledSessionsCount', header: 'Scheduled Sessions' },
    { field: 'completedSessionsCount', header: 'Completed Sessions' },
  ];

  // Dynamic action buttons based on role and permissions
  get actionButtons() {
    const buttons = [
      {
        label: 'View Enrollments',
        command: () => {
          if (!this.selectedItem()?.id) return;
          const path =
            this.basePath() ||
            (this.userRole() === RolesEnum.tutor ? '/tutor' : '/coordinator');
          void this.router.navigate([
            `${path}/courses/enrollments`,
            this.selectedItem()!.id,
          ]);
        },
      },
    ];

    if (this.userRole() === RolesEnum.coordinator) {
      buttons.push({
        label: 'Manage Sessions',
        command: () => {
          if (!this.selectedItem()?.id) return;
          const path =
            this.basePath() ||
            (this.userRole() === 'tutor' ? '/tutor' : '/coordinator');
          void this.router.navigate([
            `${path}/courses/sessions`,
            this.selectedItem()!.id,
          ]);
        },
      });
    }

    if (this.showEditAction()) {
      buttons.push({
        label: 'Edit',
        command: () => {
          if (!this.selectedItem()?.id) return;
          const path =
            this.basePath() ||
            (this.userRole() === 'tutor' ? '/tutor' : '/coordinator');
          void this.router.navigate([
            `${path}/courses/edit`,
            this.selectedItem()!.id,
          ]);
        },
      });
    }

    if (this.showDeleteAction()) {
      buttons.push({
        label: 'Delete',
        command: () => {
          if (!this.selectedItem()?.id) return;
          this.onDelete(this.selectedItem()!);
        },
      });
    }

    return buttons;
  }

  private onDelete(course: CourseItem): void {
    console.log('Delete course:', course);
  }
}
