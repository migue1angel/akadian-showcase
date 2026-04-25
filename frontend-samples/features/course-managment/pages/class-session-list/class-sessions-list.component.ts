import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ColumnModel } from '@core/models/column.model';
import { ClassSessionsHttpService } from '@features/class-sessions/services/class-sessions-http.service';
import { CoursesHttpService } from '@features/courses/services/courses-http.service';
import { TableModule } from 'primeng/table';
import { map, of } from 'rxjs';
import { Toolbar } from 'primeng/toolbar';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { ClassSessionFormComponent } from '@features/tutor/components/class-session-form/class-session-form.component';
import { ClassSessionSummary } from '@features/class-sessions/interfaces/class-session-summary.interface';
import { UnitCardComponent } from '@features/programs/components/unit-card/unit-card.component';
import { DatePipe, Location } from '@angular/common';
import { ClassSessionStatusEnum } from '@shared/enums/classes.enum';
import { Router } from '@angular/router';
import { Tag } from 'primeng/tag';
import { SplitButton } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@features/auth/services/auth.service';
import { PaginationService } from '@shared/services/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

type UserRole = 'tutor' | 'coordinator';

@Component({
  selector: 'app-class-sessions-list',
  imports: [
    TableModule,
    DatePipe,
    Toolbar,
    Button,
    Dialog,
    ClassSessionFormComponent,
    Tag,
    SplitButton,
    UnitCardComponent,
    PaginationComponent,
  ],
  templateUrl: './class-sessions-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSessionsListComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly classSessionsHttpService = inject(ClassSessionsHttpService);
  private readonly coursesHttpService = inject(CoursesHttpService);
  protected readonly location = inject(Location);
  protected readonly paginationService = inject(PaginationService);

  userRole = input.required<UserRole>();
  userId = input<string>();
  courseId = input<string>();
  showAddButton = input<boolean>(true);
  basePath = input<string>('');

  protected ClassSessionStatusEnum = ClassSessionStatusEnum;
  protected selectedClassSession = signal<ClassSessionSummary | null>(null);
  protected visibleDialog = signal<boolean>(false);
  protected unitDetailId = signal<string | undefined>(undefined);
  protected visibleUnitDialog = signal<boolean>(false);
  private readonly manageItemsCache = new Map<string, MenuItem[]>();

  courseResource = rxResource({
    params: () => this.courseId(),
    stream: ({ params: courseId }) => {
      if (!courseId) return of(null);
      return this.coursesHttpService.findOne(courseId).pipe(
        map((response) => response.data)
      );
    },
  });

  classSessionsResource = rxResource({
    params: () => ({
      role: this.userRole(),
      userId: this.userId(),
      courseId: this.courseId(),
      page: this.userRole() === 'tutor' && !this.courseId() ? this.paginationService.currentPage() : undefined,
    }),
    stream: ({ params }) => {
      if (params.role === 'tutor' && !params.courseId) {
        // For tutor without course filter, load by tutor ID with pagination
        const tutorId = this.authService.user()?.tutor?.id;
        if (!tutorId) return of({ data: [], pagination: undefined });
        return this.classSessionsHttpService.findByTutor(tutorId, {
          page: params.page || 1,
        }).pipe(
          map((response) => ({ data: response.data, pagination: response.pagination }))
        );
      } else if (params.courseId) {
        // Filter by specific course (no pagination needed, limited by program)
        return this.classSessionsHttpService.findByCourse(params.courseId).pipe(
          map((response) => ({ data: response.data, pagination: undefined }))
        );
      } else {
        // For coordinator, get all sessions (already has pagination)
        return this.classSessionsHttpService.findAll({
          page: params.page || 1,
        }).pipe(
          map((response) => ({ data: response.data, pagination: response.pagination }))
        );
      }
    },
  });

  protected sessions = computed(() => this.classSessionsResource.value()?.data || []);
  protected paginationInfo = computed(() => this.classSessionsResource.value()?.pagination);

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

  navigateToAttendanceEvaluation(classSessionId: string, courseId: string) {
    const path = this.basePath() || (this.userRole() === 'tutor' ? '/tutor' : '/coordinator');
    this.router.navigate([
      `${path}/attendance/evaluation`,
      classSessionId,
      courseId,
    ]);
  }

  startSession(meetingLink: string) {
    window.open(meetingLink, '_blank');
  }

  viewDetails(unitId: string) {
    this.unitDetailId.set(unitId);
    this.visibleUnitDialog.set(true);
  }

  getManageItems(rowData: ClassSessionSummary): MenuItem[] {
    const key = rowData.id;
    if (this.manageItemsCache.has(key)) {
      return this.manageItemsCache.get(key)!;
    }
    const items: MenuItem[] = [
      {
        label: 'View Content',
        icon: 'pi pi-book',
        command: () => this.viewDetails(rowData.unitClass.unit.id),
      },
    ];
    this.manageItemsCache.set(key, items);
    return items;
  }

  onClassSessionsCreated() {
    this.classSessionsResource.reload();
    this.visibleDialog.set(false);
  }

  cols: ColumnModel[] = [
    { field: 'program.name', header: 'Program Name' },
    { field: 'scheduledAt', header: 'Scheduled At' },
    { field: 'program', header: 'Program' },
    { field: 'classType', header: 'Class Type' },
    { field: 'status', header: 'Status' },
    { field: 'days', header: 'Days' },
  ];
}
