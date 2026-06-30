import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { PaginationParamsDto } from 'src/shared/dto/pagination-params.dto';
import { PaginatedResult } from 'src/shared/interfaces/paginated-result';
import { CreateProgramDto, CreateUnitDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { Program } from '../entities/program.entity';
import { Unit } from '../entities/unit.entity';
import { UnitClass } from '../entities/unit-class.entity';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProgramDto): Promise<Program> {
    this.validateUnits(dto.totalUnits, dto.units);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const program = queryRunner.manager.create(Program, {
        name: dto.name,
        description: dto.description ?? null,
        totalUnits: dto.totalUnits,
        isActive: dto.isActive ?? true,
        languageId: dto.languageId,
        levelId: dto.levelId,
      });

      const savedProgram = await queryRunner.manager.save(program);
      await this.createUnits(queryRunner.manager, savedProgram, dto.units);
      await queryRunner.commitTransaction();

      return this.findOne(savedProgram.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(params: PaginationParamsDto): Promise<PaginatedResult<Program>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = params.search ? { name: ILike(`%${params.search}%`) } : {};

    const [programs, total] = await this.programRepository.findAndCount({
      where,
      relations: {
        units: {
          unitClasses: true,
        },
      },
      order: {
        name: 'ASC',
        units: {
          unitNumber: 'ASC',
          unitClasses: {
            classNumber: 'ASC',
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResult(programs, total, page, limit);
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: {
        units: {
          unitClasses: true,
        },
      },
      order: {
        units: {
          unitNumber: 'ASC',
          unitClasses: {
            classNumber: 'ASC',
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async update(id: string, dto: UpdateProgramDto): Promise<Program> {
    const existingProgram = await this.findOne(id);
    const totalUnits = dto.totalUnits ?? existingProgram.totalUnits;

    if (dto.units) {
      this.validateUnits(totalUnits, dto.units);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Program, id, {
        name: dto.name ?? existingProgram.name,
        description: dto.description ?? existingProgram.description,
        totalUnits,
        isActive: dto.isActive ?? existingProgram.isActive,
        languageId: dto.languageId ?? existingProgram.languageId,
        levelId: dto.levelId ?? existingProgram.levelId,
      });

      if (dto.units) {
        await queryRunner.manager.delete(Unit, { programId: id });
        const program = queryRunner.manager.create(Program, { id });
        await this.createUnits(queryRunner.manager, program, dto.units);
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const program = await this.findOne(id);
    await this.programRepository.softRemove(program);
    return { deleted: true };
  }

  private async createUnits(
    manager: DataSource['manager'],
    program: Program,
    units: CreateUnitDto[],
  ): Promise<void> {
    for (const unitDto of units) {
      const unit = manager.create(Unit, {
        program,
        programId: program.id,
        unitNumber: unitDto.unitNumber,
        name: unitDto.name,
        description: unitDto.description ?? null,
      });
      const savedUnit = await manager.save(unit);

      const unitClasses = unitDto.unitClasses.map((unitClassDto) =>
        manager.create(UnitClass, {
          unit: savedUnit,
          unitId: savedUnit.id,
          classNumber: unitClassDto.classNumber,
          name: unitClassDto.name,
          type: unitClassDto.type,
        }),
      );

      await manager.save(UnitClass, unitClasses);
    }
  }

  private validateUnits(totalUnits: number, units: CreateUnitDto[]): void {
    if (units.length !== totalUnits) {
      throw new BadRequestException('The number of units must match totalUnits');
    }

    const unitNumbers = new Set<number>();

    for (const unit of units) {
      if (unitNumbers.has(unit.unitNumber)) {
        throw new BadRequestException('Unit numbers must be unique');
      }

      unitNumbers.add(unit.unitNumber);

      const classNumbers = new Set<number>();
      for (const unitClass of unit.unitClasses) {
        if (classNumbers.has(unitClass.classNumber)) {
          throw new BadRequestException('Class numbers must be unique within a unit');
        }

        classNumbers.add(unitClass.classNumber);
      }
    }
  }
}
