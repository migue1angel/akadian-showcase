import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { EvaluationType } from '../../common/enums/entities.enum';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'ID del estudiante' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'ID del curso' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: 'ID de la suscripción a usar' })
  @IsUUID()
  subscriptionId: string;
}

export class ChangeEnrollmentSubscriptionDto {
  @ApiProperty({ description: 'ID de la nueva suscripción' })
  @IsUUID()
  newSubscriptionId: string;
}

export class EnrollmentProgressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  programName: string;

  @ApiProperty()
  startingClassNumber: number;

  @ApiProperty()
  classesCompleted: number;

  @ApiProperty()
  totalClassesRequired: number;

  @ApiProperty()
  progressPercentage: number;

  @ApiProperty()
  totalPointsEarned: number;

  @ApiProperty()
  attendancePercentage: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  finalResult: string;

  @ApiProperty({ description: 'Si está en grace period, cuántos días quedan' })
  gracePeriodDaysRemaining?: number;

  @ApiProperty()
  canAttendClasses: boolean;

  @ApiProperty()
  nextClassDate?: Date;

  @ApiProperty({
    description: 'Clases que le faltan para completar el programa',
  })
  classesRemaining: number;
}

export class EnrollmentEvaluationSummaryDto {
  @ApiProperty()
  enrollmentId: string;

  @ApiProperty({ description: 'Resumen por tipo de evaluación' })
  evaluationsByType: Array<{
    evaluationType?: EvaluationType;
    criteriaName: string;
    pointsEarned: number;
    maxPoints: number;
    percentage: number;
    weight: number;
    weightedScore: number;
  }>;

  @ApiProperty()
  totalWeightedScore: number;

  @ApiProperty()
  totalPossibleScore: number;

  @ApiProperty()
  overallPercentage: number;

  @ApiProperty()
  attendancePercentage: number;

  @ApiProperty()
  minPassPercentage: number;

  @ApiProperty()
  minAttendancePercentage: number;

  @ApiProperty()
  isPassingGrade: boolean;

  @ApiProperty()
  isPassingAttendance: boolean;

  @ApiProperty()
  wouldPass: boolean;
}

export class CourseChangeRequestDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  currentEnrollmentId: string;

  @ApiProperty()
  @IsUUID()
  requestedCourseId: string;

  @ApiProperty()
  reason: string;
}
