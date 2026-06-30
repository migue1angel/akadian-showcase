import { Injectable, Logger } from "@nestjs/common";
import { roles } from "../data";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { envs } from "src/config/envs";
import { Role } from "src/modules/iam/entities/role.entity";
import { Permission } from "src/modules/iam/entities/permission.entity";
import { UsersService } from "src/modules/iam/services/users.service";
import { Program } from "src/modules/programs/entities/program.entity";
import { Unit } from "src/modules/programs/entities/unit.entity";
import { UnitClass } from "src/modules/programs/entities/unit-class.entity";

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private createdRoles: Role[] = [];
  private createdPermissions: Permission[] = [];

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(UnitClass)
    private readonly unitClassRepository: Repository<UnitClass>,
    private readonly usersService: UsersService,
  ) {}

  async run() {
    this.logger.log('Seeding database...');
    try {
      await this.seedPermissions();
      await this.seedRoles();
      await this.seedUsers();
      await this.seedDemoPrograms();
      this.logger.log('Database seeded successfully');
    } catch (error) {
      this.logger.error(`Error seeding database: ${error.message}`, error.stack);
    }
  }

  private async seedPermissions() {
    const permissionsToSeed = [
      { name: 'programs:read', description: 'Read academic programs information' },
      { name: 'programs:write', description: 'Create and update academic programs' },
      { name: 'programs:delete', description: 'Delete academic programs' },
      { name: 'payments:manage', description: 'Manage and trigger checkout operations' },
    ];

    const promises = permissionsToSeed.map(async (p) => {
      let permission = await this.permissionRepository.findOneBy({ name: p.name });
      if (!permission) {
        permission = await this.permissionRepository.save(
          this.permissionRepository.create(p)
        );
        this.logger.log(`Permission ${p.name} created`);
      }
      return permission;
    });

    this.createdPermissions = await Promise.all(promises);
  }

  private async seedRoles() {
    // Map permissions by role
    const rolePermissionsMapping: Record<string, string[]> = {
      ADMIN: ['programs:read', 'programs:write', 'programs:delete', 'payments:manage'],
      COORDINATOR: ['programs:read', 'programs:write'],
      TUTOR: ['programs:read'],
      STUDENT: ['programs:read', 'payments:manage'],
    };

    const promises = roles.map(async (roleName) => {
      let role = await this.roleRepository.findOne({
        where: { name: roleName },
        relations: { permissions: true },
      });

      const rolePermissionNames = rolePermissionsMapping[roleName] || [];
      const rolePermissions = this.createdPermissions.filter(p => rolePermissionNames.includes(p.name));

      if (!role) {
        role = await this.roleRepository.save(
          this.roleRepository.create({
            name: roleName,
            description: `${roleName} default role`,
            permissions: rolePermissions,
          })
        );
        this.logger.log(`Role ${roleName} created with ${rolePermissions.length} permissions`);
      } else {
        // Sync permissions
        role.permissions = rolePermissions;
        role = await this.roleRepository.save(role);
      }
      return role;
    });

    this.createdRoles = await Promise.all(promises);
  }

  private async seedUsers() {
    const adminRole = this.createdRoles.find(r => r.name === 'ADMIN');
    const coordRole = this.createdRoles.find(r => r.name === 'COORDINATOR');
    const tutorRole = this.createdRoles.find(r => r.name === 'TUTOR');
    const studentRole = this.createdRoles.find(r => r.name === 'STUDENT');

    const usersToSeed = [
      {
        email: envs.adminEmail,
        password: envs.adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: adminRole,
      },
      {
        email: 'coordinator@showcase.dev',
        password: 'Password123!',
        firstName: 'Coordinator',
        lastName: 'User',
        role: coordRole,
      },
      {
        email: 'tutor@showcase.dev',
        password: 'Password123!',
        firstName: 'Tutor',
        lastName: 'User',
        role: tutorRole,
      },
      {
        email: 'student@showcase.dev',
        password: 'Password123!',
        firstName: 'Student',
        lastName: 'User',
        role: studentRole,
      },
    ];

    for (const u of usersToSeed) {
      if (!u.role) continue;
      try {
        await this.usersService.createUser({
          email: u.email,
          password: u.password,
          firstName: u.firstName,
          lastName: u.lastName,
          roleIds: [u.role.id],
        });
        this.logger.log(`User ${u.firstName} (${u.email}) created`);
      } catch (error) {
        if (error.code === 'USER_ALREADY_EXISTS') {
          this.logger.log(`User ${u.email} already exists`);
        } else {
          throw error;
        }
      }
    }
  }

  private async seedDemoPrograms() {
    const demoPrograms = [
      {
        name: 'English A1 Beginner',
        description: 'Basic introduction to English grammar and conversation.',
        totalUnits: 2,
        isActive: true,
        languageId: '00000000-0000-0000-0000-000000000001', // Dummy UUIDs for language catalog
        levelId: '00000000-0000-0000-0000-000000000002', // Dummy UUIDs for levels catalog
        units: [
          {
            unitNumber: 1,
            name: 'Greetings & Introductions',
            description: 'Learn standard expressions of courtesy and simple responses.',
            classes: [
              { classNumber: 1, name: 'Saying Hello and Goodbye', type: 'lecture' },
              { classNumber: 2, name: 'Introducing Yourself', type: 'practice' },
            ],
          },
          {
            unitNumber: 2,
            name: 'Numbers & Colors',
            description: 'Count objects and define basic visual features.',
            classes: [
              { classNumber: 3, name: 'Numbers 1 to 20', type: 'lecture' },
              { classNumber: 4, name: 'Basic Colors', type: 'practice' },
            ],
          },
        ],
      },
      {
        name: 'English B1 Intermediate',
        description: 'Grammar enhancement and moderate lexical scope.',
        totalUnits: 2,
        isActive: true,
        languageId: '00000000-0000-0000-0000-000000000001',
        levelId: '00000000-0000-0000-0000-000000000003',
        units: [
          {
            unitNumber: 1,
            name: 'Expressing Opinions',
            description: 'Agreeing, disagreeing and stating your viewpoint on standard topics.',
            classes: [
              { classNumber: 1, name: 'Agreeing and Disagreeing politely', type: 'lecture' },
              { classNumber: 2, name: 'Debating common social issues', type: 'debate' },
            ],
          },
          {
            unitNumber: 2,
            name: 'Past Tenses in Context',
            description: 'Mastering simple past and continuous narratives.',
            classes: [
              { classNumber: 3, name: 'Storytelling past narrative', type: 'lecture' },
              { classNumber: 4, name: 'Writing simple historical essays', type: 'practice' },
            ],
          },
        ],
      },
    ];

    for (const dp of demoPrograms) {
      let program = await this.programRepository.findOneBy({ name: dp.name });
      if (!program) {
        // Create Program
        program = await this.programRepository.save(
          this.programRepository.create({
            name: dp.name,
            description: dp.description,
            totalUnits: dp.totalUnits,
            isActive: dp.isActive,
            languageId: dp.languageId,
            levelId: dp.levelId,
          })
        );
        this.logger.log(`Demo Program ${dp.name} created`);

        // Create Units & Classes
        for (const u of dp.units) {
          const unit = await this.unitRepository.save(
            this.unitRepository.create({
              programId: program.id,
              unitNumber: u.unitNumber,
              name: u.name,
              description: u.description,
            })
          );
          this.logger.log(`  Unit #${u.unitNumber}: ${u.name} created`);

          for (const c of u.classes) {
            await this.unitClassRepository.save(
              this.unitClassRepository.create({
                unitId: unit.id,
                classNumber: c.classNumber,
                name: c.name,
                type: c.type,
              })
            );
            this.logger.log(`    Class #${c.classNumber}: ${c.name} (${c.type}) created`);
          }
        }
      } else {
        this.logger.log(`Demo Program ${dp.name} already exists`);
      }
    }
  }
}
