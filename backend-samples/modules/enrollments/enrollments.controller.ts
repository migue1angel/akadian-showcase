import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateEnrollmentDto,
  ChangeEnrollmentSubscriptionDto,
  EnrollmentProgressDto,
  EnrollmentEvaluationSummaryDto,
} from './dto/enrollment-dto';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Enrollments')
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear matrícula',
    description:
      'Matricula un estudiante en un curso validando suscripción, espacios y elegibilidad',
  })
  @ApiResponse({ status: 201, description: 'Matrícula creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'No cumple requisitos para matricularse',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya está matriculado o curso lleno',
  })
  async createEnrollment(@Body() dto: CreateEnrollmentDto) {
    return {
        data: await this.enrollmentsService.createEnrollment(dto),
        message: 'Enrollment created successfully'
    } 
  }

  @Get(':id/progress')
  @ApiOperation({
    summary: 'Obtener progreso del enrollment',
    description:
      'Retorna progreso detallado incluyendo clases completadas, porcentaje, etc.',
  })
  @ApiResponse({ status: 200, type: EnrollmentProgressDto })
  async getProgress(@Param('id') id: string) {
    const data = await this.enrollmentsService.getEnrollmentProgress(id);
    return {
      data,
      message: 'Enrollment progress retrieved successfully',
    };
  }

  @Get(':id/evaluation-summary')
  @ApiOperation({
    summary: 'Obtener resumen de evaluaciones',
    description:
      'Calcula puntajes por tipo de evaluación y determina si el estudiante va aprobando',
  })
  @ApiResponse({ status: 200, type: EnrollmentEvaluationSummaryDto })
  async getEvaluationSummary(@Param('id') id: string) {
    const data = await this.enrollmentsService.getEnrollmentEvaluationSummary(id);
    return {
      data,
      message: 'Enrollment evaluation summary retrieved successfully',
    };
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar matrícula',
    description: 'Cancela una matrícula activa o en grace period',
  })
  @ApiResponse({ status: 200 })
  async cancelEnrollment(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const data = await this.enrollmentsService.cancelEnrollment(id, reason);
    return {
      data,
      message: 'Enrollment cancelled successfully',
    };
  }

  @Patch(':id/reactivate')
  @ApiOperation({
    summary: 'Reactivar matrícula',
    description: 'Reactiva una matrícula cancelada o suspendida',
  })
  @ApiResponse({ status: 200 })
  async reactivateEnrollment(@Param('id') id: string) {
    const data = await this.enrollmentsService.reactivateEnrollment(id);
    return {
      data,
      message: 'Enrollment reactivated successfully',
    };
  }

  @Patch(':id/change-subscription')
  @ApiOperation({
    summary: 'Cambiar suscripción de matrícula',
    description: 'Cambia la suscripción de una matrícula en grace period',
  })
  @ApiResponse({ status: 200 })
  async changeEnrollmentSubscription(
    @Param('id') id: string,
    @Body() dto: ChangeEnrollmentSubscriptionDto,
  ) {
    const data = await this.enrollmentsService.changeEnrollmentSubscription(
      id,
      dto.newSubscriptionId,
    );
    return {
      data,
      message: 'Enrollment subscription changed successfully',
    };
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Obtener matrículas del estudiante',
    description: 'Lista todas las matrículas de un estudiante',
  })
  @ApiResponse({ status: 200 })
  async getStudentEnrollments(@Param('studentId') studentId: string) {
    const data = await this.enrollmentsService.getStudentEnrollments(studentId);
    return {
      data,
      message: 'Student enrollments retrieved successfully',
    };
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Obtener matrículas del curso',
    description: 'Lista estudiantes matriculados con su progreso',
  })
  @ApiResponse({ status: 200, type: [EnrollmentProgressDto] })
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    const data = await this.enrollmentsService.getCourseEnrollments(courseId);
    return {
      data,
      message: 'Course enrollments retrieved successfully',
    };
  }
}
