import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EnrollmentsHttpService } from '@features/student/services/enrollments-http.service';
import { CoursesHttpService } from '@features/courses/services/courses-http.service';
import { AttendanceEvaluationHttpService } from '@features/attendance-evaluation/services/attendance-evaluation-http.service';
import { map, of } from 'rxjs';
import { Location } from '@angular/common';
import { Panel } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ColumnModel } from '@core/models/column.model';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { CourseEnrollment } from '@features/courses/interfaces/course-enrollment.interface';
import { EnrollmentEvaluationDialogComponent } from '@features/attendance-evaluation/components/enrollment-evaluation-dialog/enrollment-evaluation-dialog.component';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { CustomMessageService } from '@core/services/custom-message.service';
import { RolesEnum } from '@shared/enums/roles.enum';

type UserRole = 'tutor' | 'coordinator' | 'admin';

@Component({
  selector: 'app-course-enrollment-list',
  imports: [Panel, TableModule, Button, Menu, EnrollmentEvaluationDialogComponent, ConfirmDialog],
  templateUrl: './course-enrollment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseEnrollmentListComponent {
  private readonly enrollmentsHttpService = inject(EnrollmentsHttpService);
  private readonly coursesHttpService = inject(CoursesHttpService);
  private readonly attendanceEvaluationService = inject(AttendanceEvaluationHttpService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(CustomMessageService);
  private readonly router = inject(Router);
  protected readonly location = inject(Location);
  protected readonly RolesEnum = RolesEnum;

  // Input properties for role-based configuration
  userRole = input.required<UserRole>();
  courseId = input.required<string>();
  basePath = input<string>('');

  protected selectedItem = signal<CourseEnrollment | null>(null);
  protected showEvaluationDialog = signal(false);

  courseResource = rxResource({
    params: () => this.courseId(),
    stream: ({ params: courseId }) => {
      if (!courseId) return of(null);
      return this.coursesHttpService.findOne(courseId).pipe(
        map((response) => response.data)
      );
    },
  });

  enrollmentsResource = rxResource({
    params: () => this.courseId(),
    stream: () => {
      const courseId = this.courseId();
      if (!courseId) return of([]);
      return this.enrollmentsHttpService
        .getCourseEnrollments(courseId)
        .pipe(map((response) => response.data));
    },
  });

  protected courseInfo = computed(() => {
    const course = this.courseResource.value();
    if (!course) return null;
    return {
      programName: course.program.name,
      level: course.program.level?.name,
      tutorName: `${course.tutor.user.firstName} ${course.tutor.user.lastName}`,
      timeSlot: course.timeSlot,
      timezone: course.timezone,
      days: course.days.join(', '),
      ageGroup: course.ageGroup,
    };
  });

  protected cols: ColumnModel[] = [
    { field: 'studentName', header: 'Student Name' },
    { field: 'programName', header: 'Program Name' },
    { field: 'classesCompleted', header: 'Classes Completed' },
    { field: 'totalClassesRequired', header: 'Total Classes Required' },
    { field: 'progressPercentage', header: 'Progress (%)' },
    { field: 'status', header: 'Status' },
    { field: 'finalResult', header: 'Final Result' },
    { field: 'canAttendClasses', header: 'Can Attend Classes' },
    { field: 'classesRemaining', header: 'Classes Remaining' },
  ];

  actionButtons = computed(() => {
    const role = this.userRole();
    const canManageEvaluations =
      role === 'tutor' ||
      role === 'coordinator' ||
      role === 'admin';

    return [
      {
        label: 'View Progress',
        icon: 'pi pi-chart-line',
        command: () => {
          if (!this.selectedItem()?.id) return;
          const path = this.basePath() || (role === 'tutor' ? '/tutor' : '/coordinator');
          void this.router.navigate([
            `${path}/student-progress`,
            this.selectedItem()!.id,
          ]);
        },
      },
      {
        label: 'Add Grade',
        icon: 'pi pi-pencil',
        visible: canManageEvaluations,
        command: () => {
          this.openEvaluationDialog();
        },
      },
      {
        label: 'Recalculate Progress',
        icon: 'pi pi-refresh',
        visible: canManageEvaluations,
        command: () => {
          this.confirmRecalculateStats();
        },
      },
    ];
  });

  openEvaluationDialog(): void {
    this.showEvaluationDialog.set(true);
  }

  onEvaluationRecorded(): void {
    this.enrollmentsResource.reload();
    this.showEvaluationDialog.set(false);
  }

  confirmRecalculateStats(): void {
    const enrollment = this.selectedItem();
    if (!enrollment) return;

    this.confirmationService.confirm({
      message: 'This will recalculate attendance percentage, weighted grade, and final result for this student. Continue?',
      header: 'Recalculate Progress',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Recalculate',
      rejectLabel: 'Cancel',
      accept: () => {
        this.recalculateStats(enrollment.id);
      },
    });
  }

  recalculateStats(enrollmentId: string): void {
    this.attendanceEvaluationService
      .recalculateStats(enrollmentId)
      .subscribe({
        next: (response) => {
          const result = response.data;
          this.messageService.showSuccess(
            response.message || `Progress recalculated successfully. Attendance: ${result.attendance.toFixed(1)}%, Grade: ${result.points.toFixed(1)}%, Result: ${result.finalResult}`
          );
          this.enrollmentsResource.reload();
        },
        error: (error) => {
          this.messageService.showError(
            error.error?.message || 'Failed to recalculate progress'
          );
        },
      });
  }
}
