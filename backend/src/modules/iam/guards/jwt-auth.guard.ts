import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { AuthError } from '../errors/auth.errors';
import { envs } from 'src/config/envs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken;

    if (!token) {
      throw AuthError.NoTokenProvided();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: envs.jwt.accessSecret,
      });
      request['user'] = payload;
    } catch (error) {
      throw AuthError.InvalidToken();
    }
    return true;
  }
}
