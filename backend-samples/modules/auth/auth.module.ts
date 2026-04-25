import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken, Role, User, VerificationCode } from '../common/entities';
import { UsersController } from '../users/users.controller';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Role, RefreshToken, VerificationCode]),
    MailModule,
    RedisModule,
  ],
  providers: [AuthService, UsersService, JwtStrategy],
  controllers: [AuthController, UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class AuthModule {}
