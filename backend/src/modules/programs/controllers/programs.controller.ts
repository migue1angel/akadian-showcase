import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/iam/guards/jwt-auth.guard';
import { PaginationParamsDto } from 'src/shared/dto/pagination-params.dto';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { ProgramsService } from '../services/programs.service';

import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Programs')
@ApiCookieAuth()
@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.COORDINATOR)
  @ApiResponse({ status: 201, description: 'Program created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'List of programs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() params: PaginationParamsDto) {
    return this.programsService.findAll(params);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Program details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.COORDINATOR)
  @ApiResponse({ status: 200, description: 'Program updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  @ApiResponse({ status: 200, description: 'Program removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
}
