import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { SeedService } from './services/seed.service';
import { IamModule } from '../modules/iam/iam.module';
import { ProgramsModule } from '../modules/programs/programs.module';
import { Permission } from '../modules/iam/entities/permission.entity';
import { Program } from '../modules/programs/entities/program.entity';
import { Unit } from '../modules/programs/entities/unit.entity';
import { UnitClass } from '../modules/programs/entities/unit-class.entity';

@Module({
    providers: [SeedService],
    imports: [
        DatabaseModule, 
        IamModule, 
        ProgramsModule,
        TypeOrmModule.forFeature([Permission, Program, Unit, UnitClass]),
    ],
})
export class SeedModule { }
