import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { IamModule } from 'src/modules/iam/iam.module';
import { ProgramsController } from './controllers/programs.controller';
import { Program } from './entities/program.entity';
import { Unit } from './entities/unit.entity';
import { UnitClass } from './entities/unit-class.entity';
import { ProgramsService } from './services/programs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Unit, UnitClass]), IamModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, RolesGuard],
  exports: [TypeOrmModule],
})
export class ProgramsModule {}
