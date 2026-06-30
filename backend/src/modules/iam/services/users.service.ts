import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { UserError } from '../errors/user.errors';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { HashingService } from './hashing.service';

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly hashingService: HashingService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: { roles: true },
    });
  }

  async findById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });

    if (!user) {
      throw UserError.UserNotFound();
    }

    return this.toSafeUser(user);
  }

  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.getUserEntityById(userId);

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }

    return this.toSafeUser(await this.userRepository.save(user));
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ changed: true }> {
    const user = await this.getUserEntityById(userId);
    const isCurrentPasswordValid = await this.hashingService.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw UserError.InvalidCurrentPassword();
    }

    user.passwordHash = await this.hashingService.hash(dto.newPassword);
    await this.userRepository.save(user);

    return { changed: true };
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return this.hashingService.compare(password, user.passwordHash);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existingUser = await this.findByEmail(input.email);

    if (existingUser) {
      throw UserError.AlreadyExists();
    }

    const roles = input.roleIds?.length
      ? await this.roleRepository.findByIds(input.roleIds)
      : [];

    if (input.roleIds?.length && roles.length !== input.roleIds.length) {
      throw UserError.RoleNotFound();
    }

    const user = this.userRepository.create({
      email: input.email,
      passwordHash: await this.hashingService.hash(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      isActive: true,
      emailVerified: true,
      roles,
    });

    return this.userRepository.save(user);
  }

  toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      roles: user.roles?.map((role) => role.name) ?? [],
    };
  }

  private async getUserEntityById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });

    if (!user) {
      throw UserError.UserNotFound();
    }

    return user;
  }
}
