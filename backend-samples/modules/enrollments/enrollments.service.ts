import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository, DataSource, In, MoreThan } from 'typeorm';
import {
  Enrollment,
  Course,
  Student,
  ClassSession,
  StudentEvaluation,
  EvaluationCriteria,
  Subscription,
  SubscriptionType,
} from '../common/entities';
import {
  EnrollmentStatus,
  FinalResult,
  ClassSessionStatus,
  SubscriptionStatus,
} from '../common/enums/entities.enum';
import { SubscriptionsService } from '../subscriptions/services/subscriptions.service';
import {
  CreateEnrollmentDto,
  EnrollmentProgressDto,
  EnrollmentEvaluationSummaryDto,
} from './dto/enrollment-dto';
import { validateLoadedRelations } from '@/utils/helpers/validate-relations.helper';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(ClassSession)
    private readonly classSessionRepo: Repository<ClassSession>,

    @InjectRepository(StudentEvaluation)
    private readonly evaluationRepo: Repository<StudentEvaluation>,

    @InjectRepository(EvaluationCriteria)
    private readonly criteriaRepo: Repository<EvaluationCriteria>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,

    private readonly subscriptionService: SubscriptionsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new enrollment and ensures subscription dates are active for first use.
   */
  async createEnrollment(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId, isActive: true },
      relations: ['program'],
    });

    if (!course) {
      throw new NotFoundException('Course not found or inactive');
    }

    const eligibility =
      await this.subscriptionService.checkEnrollmentEligibility({
        studentId: dto.studentId,
        courseId: dto.courseId,
        subscriptionId: dto.subscriptionId,
      });

    if (!eligibility.canEnroll) {
      throw new BadRequestException(eligibility.reason);
    }

    const subscription = eligibility.subscription!;

    if (!subscription.startDate || !subscription.endDate) {
      throw new BadRequestException(
        'Subscription does not have valid dates. Please contact support.',
      );
    }

    if (subscription.status === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException(
        'Subscription has expired. Please renew to enroll.',
      );
    }

    const existingEnrollment = await this.enrollmentRepo.findOne({
      where: {
        studentId: dto.studentId,
        courseId: dto.courseId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    await this.validateCourseCapacity(dto.courseId);

    const nextClassNumber = await this.getNextScheduledClassNumber(
      dto.courseId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enrollment = queryRunner.manager.create(Enrollment, {
        studentId: dto.studentId,
        courseId: dto.courseId,
        subscriptionId: dto.subscriptionId,
        status: EnrollmentStatus.ACTIVE,
        startingClassNumber: nextClassNumber,
        classesCompleted: 0,
        totalPointsEarned: 0,
        totalAttendancePercentage: 0,
        finalResult: FinalResult.IN_PROGRESS,
      });

      const savedEnrollment = await queryRunner.manager.save(enrollment);

      await queryRunner.manager.increment(
        Course,
        { id: dto.courseId },
        'currentParticipants',
        1,
      );

      await queryRunner.commitTransaction();

      return savedEnrollment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getEnrollmentProgress(
    enrollmentId: string,
  ): Promise<EnrollmentProgressDto> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['student', 'student.user', 'course', 'course.program'],
      withDeleted: true,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    validateLoadedRelations(
      enrollment,
      ['student', 'student.user', 'course', 'course.program'],
      'Enrollment',
    );

    const totalClasses = enrollment.course.program.totalClasses;

    const progressPercentage =
      (enrollment.classesCompleted / totalClasses) * 100;

    const classesRemaining = Math.max(
      0,
      totalClasses - enrollment.classesCompleted,
    );

    let gracePeriodDaysRemaining: number | undefined;
    if (
      enrollment.status === EnrollmentStatus.GRACE_PERIOD &&
      enrollment.gracePeriodEndsAt
    ) {
      const now = DateTime.now();
      const endsAt = DateTime.fromJSDate(enrollment.gracePeriodEndsAt);
      gracePeriodDaysRemaining = Math.max(
        0,
        Math.ceil(endsAt.diff(now, 'days').days),
      );
    }

    const nextClass = await this.classSessionRepo.findOne({
      where: {
        courseId: enrollment.courseId,
        status: ClassSessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
      order: { scheduledAt: 'ASC' },
    });

    return {
      id: enrollment.id,
      studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName ?? ''}`,
      programName: enrollment.course.program.name,
      startingClassNumber: enrollment.startingClassNumber,
      classesCompleted: enrollment.classesCompleted,
      totalClassesRequired: totalClasses,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      totalPointsEarned: Number.parseFloat(
        enrollment.totalPointsEarned.toString(),
      ),
      attendancePercentage: Number.parseFloat(
        enrollment.totalAttendancePercentage.toString(),
      ),
      status: enrollment.status,
      finalResult: enrollment.finalResult,
      gracePeriodDaysRemaining,
      canAttendClasses: enrollment.status === EnrollmentStatus.ACTIVE,
      nextClassDate: nextClass?.scheduledAt,
      classesRemaining,
    };
  }

  /**
   * Calculates the evaluation summary for an enrollment.
   */
  async getEnrollmentEvaluationSummary(
    enrollmentId: string,
  ): Promise<EnrollmentEvaluationSummaryDto> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'course.program'],
      withDeleted: true,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    validateLoadedRelations(
      enrollment,
      ['course', 'course.program'],
      'Enrollment',
    );

    const criteria = await this.criteriaRepo.find({
      where: {
        programId: enrollment.course.programId,
        isActive: true,
      },
      relations: ['template'],
    });

    const evaluations = await this.evaluationRepo.find({
      where: { enrollmentId },
      relations: ['evaluationCriteria', 'evaluationCriteria.template'],
    });

    const evaluationsByType = criteria.map((criterion) => {
      const criterionEvals = evaluations.filter(
        (e) => e.evaluationCriteriaId === criterion.id,
      );

      const pointsEarned = criterionEvals.reduce(
        (sum, e) => sum + parseFloat(e.pointsEarned.toString()),
        0,
      );
      const maxPoints = criterionEvals.reduce(
        (sum, e) => sum + parseFloat(e.maxPoints.toString()),
        0,
      );

      const percentage = maxPoints > 0 ? (pointsEarned / maxPoints) * 100 : 0;
      const weight = criterion.evaluationCriteriaTemplate.weightPercentage ?? 0;
      const weightedScore = (percentage * weight) / 100;

      return {
        evaluationType: criterion.evaluationCriteriaTemplate.evaluationType,
        criteriaName: criterion.evaluationCriteriaTemplate.name,
        pointsEarned: Math.round(pointsEarned * 100) / 100,
        maxPoints: Math.round(maxPoints * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        weight,
        weightedScore: Math.round(weightedScore * 100) / 100,
      };
    });

    const totalWeightedScore = evaluationsByType.reduce(
      (sum, e) => sum + e.weightedScore,
      0,
    );
    const totalPossibleScore = 100;

    const overallPercentage = totalWeightedScore;

    const minPassPercentage = enrollment.course.program.minPassPercentage;
    const minAttendancePercentage =
      enrollment.course.program.minAttendancePercentage;

    const isPassingGrade = overallPercentage >= minPassPercentage;
    const isPassingAttendance =
      enrollment.totalAttendancePercentage >= minAttendancePercentage;

    return {
      enrollmentId,
      evaluationsByType,
      totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
      totalPossibleScore,
      overallPercentage: Math.round(overallPercentage * 100) / 100,
      attendancePercentage: parseFloat(
        enrollment.totalAttendancePercentage.toString(),
      ),
      minPassPercentage,
      minAttendancePercentage,
      isPassingGrade,
      isPassingAttendance,
      wouldPass: isPassingGrade && isPassingAttendance,
    };
  }

  /**
   * Cancels an enrollment manually.
   */
  async cancelEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (
      ![EnrollmentStatus.ACTIVE, EnrollmentStatus.GRACE_PERIOD].includes(
        enrollment.status,
      )
    ) {
      throw new BadRequestException(
        'Cannot cancel enrollment in current status',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Enrollment, enrollmentId, {
        status: EnrollmentStatus.CANCELLED,
        cancelledAt: DateTime.now().toJSDate(),
      });

      await queryRunner.manager.decrement(
        Course,
        { id: enrollment.courseId },
        'currentParticipants',
        1,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reactivates a cancelled or suspended enrollment.
   */
  async reactivateEnrollment(enrollmentId: string): Promise<void> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'subscription'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (
      ![EnrollmentStatus.CANCELLED, EnrollmentStatus.SUSPENDED].includes(
        enrollment.status,
      )
    ) {
      throw new BadRequestException(
        'Cannot reactivate enrollment in current status',
      );
    }

    const course = await this.courseRepo.findOne({
      where: { id: enrollment.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.currentParticipants >= course.maxParticipants) {
      throw new BadRequestException('Course is full');
    }

    const now = DateTime.now();
    const endDate = DateTime.fromJSDate(enrollment.subscription.endDate);
    const isSubscriptionValid = endDate > now;

    if (
      enrollment.subscription.status === SubscriptionStatus.EXPIRED ||
      (!isSubscriptionValid && enrollment.subscription.status !== SubscriptionStatus.ACTIVE)
    ) {
      throw new BadRequestException(
        'Cannot reactivate enrollment: subscription is expired or invalid',
      );
    }

    if (
      enrollment.subscription.status === SubscriptionStatus.CANCELLED &&
      !isSubscriptionValid
    ) {
      throw new BadRequestException(
        'Cannot reactivate enrollment: subscription is cancelled and has no valid days remaining',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Enrollment, enrollmentId, {
        status: EnrollmentStatus.ACTIVE,
        cancelledAt: null,
        gracePeriodEndsAt: null,
      });

      await queryRunner.manager.increment(
        Course,
        { id: enrollment.courseId },
        'currentParticipants',
        1,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Changes the subscription for an enrollment in GRACE_PERIOD.
   */
  async changeEnrollmentSubscription(
    enrollmentId: string,
    newSubscriptionId: string,
  ): Promise<void> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['subscription', 'course'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.GRACE_PERIOD) {
      throw new BadRequestException(
        'Can only change subscription for enrollments in GRACE_PERIOD',
      );
    }

    const newSubscription = await this.subscriptionRepo.findOne({
      where: { id: newSubscriptionId },
      relations: ['subscriptionType', 'student'],
    });

    if (!newSubscription) {
      throw new NotFoundException('New subscription not found');
    }

    if (newSubscription.studentId !== enrollment.studentId) {
      throw new BadRequestException(
        'New subscription must belong to the same student',
      );
    }

    const now = DateTime.now();
    const endDate = DateTime.fromJSDate(newSubscription.endDate);
    const isSubscriptionValid = endDate > now;

    if (
      newSubscription.status === SubscriptionStatus.EXPIRED ||
      (!isSubscriptionValid && newSubscription.status !== SubscriptionStatus.ACTIVE)
    ) {
      throw new BadRequestException(
        'New subscription is expired or invalid',
      );
    }

    const existingActiveEnrollment = await this.enrollmentRepo.findOne({
      where: {
        subscriptionId: newSubscriptionId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (existingActiveEnrollment) {
      throw new ConflictException(
        'New subscription already has an active enrollment',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Enrollment, enrollmentId, {
        subscriptionId: newSubscriptionId,
        status: EnrollmentStatus.ACTIVE,
        gracePeriodEndsAt: null,
      });

      await queryRunner.manager.increment(
        Course,
        { id: enrollment.courseId },
        'currentParticipants',
        1,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Returns enrollments for a student with full related data.
   */
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { studentId },
      relations: {
        course: {
          program: true,
          tutor: { user: true },
        },
        subscription: { subscriptionType: true },
      },
      withDeleted: true,
      select: {
        id: true,
        studentId: true,
        courseId: true,
        subscriptionId: true,
        status: true,
        startingClassNumber: true,
        classesCompleted: true,
        totalPointsEarned: true,
        totalAttendancePercentage: true,
        finalResult: true,
        gracePeriodEndsAt: true,
        completedAt: true,
        cancelledAt: true,
        createdAt: true,
        course: {
          id: true,
          timeSlot: true,
          timezone: true,
          program: {
            id: true,
            name: true,
            totalClasses: true,
          },
          tutor: {
            id: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        subscription: {
          id: true,
          status: true,
          autoRenew: true,
          endDate: true,
          subscriptionType: {
            name: true,
            isTrial: true,
          },
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns enrollments for a course.
   */
  async getCourseEnrollments(
    courseId: string,
  ): Promise<EnrollmentProgressDto[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: {
        courseId,
        status: In([EnrollmentStatus.ACTIVE, EnrollmentStatus.GRACE_PERIOD]),
      },
    });

    return Promise.all(
      enrollments.map((e) => this.getEnrollmentProgress(e.id)),
    );
  }

  /**
   * Ensures the course has available capacity.
   */
  private async validateCourseCapacity(courseId: string): Promise<void> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.currentParticipants >= course.maxParticipants) {
      throw new ConflictException('Course is full');
    }
  }

  /**
   * Returns the next scheduled class number for the course.
   */
  private async getNextScheduledClassNumber(courseId: string): Promise<number> {
    const nextClass = await this.classSessionRepo.findOne({
      where: {
        courseId,
        status: ClassSessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
      order: { scheduledAt: 'ASC' },
    });

    return nextClass?.classNumber || 1;
  }
}
