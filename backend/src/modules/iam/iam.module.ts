import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { HashingService } from './services/hashing.service';
import { envs } from 'src/config/envs';
import Redis from 'ioredis';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { REDIS_CLIENT } from 'src/shared/consts/redis';
import { AuthService } from './services/auth/auth.service';
import { RedisTokenService } from './services/redis-token.service';
import { UsersService } from './services/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    JwtModule.register({ global: true }),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    AuthService,
    UsersService,
    HashingService,
    RedisTokenService,
    JwtAuthGuard,
    {
      provide: REDIS_CLIENT,
      useFactory() {
        return new Redis(envs.redis.url);
      },
    },
  ],
  exports: [TypeOrmModule, UsersService, HashingService, JwtAuthGuard],
})
export class IamModule {}
