import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { envs } from 'src/config/envs';
import { RedisTTL } from 'src/shared/consts/redis';
import { LoginDto } from '../../dto/login.dto';
import { AuthError } from '../../errors/auth.errors';
import { TokenPayload } from '../../interfaces/token-payload.interface';
import { RedisTokenService } from '../redis-token.service';
import { UsersService } from '../users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisTokenService: RedisTokenService,
  ) {}

  async login(dto: LoginDto, response: Response) {
    if (await this.redisTokenService.isLoginLocked(dto.email)) {
      throw AuthError.AccountLocked();
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      await this.redisTokenService.incrementLoginFailures(dto.email);
      throw AuthError.InvalidCredentials();
    }

    user.verifyIsActive();

    const isPasswordValid = await this.usersService.validatePassword(user, dto.password);

    if (!isPasswordValid) {
      await this.redisTokenService.incrementLoginFailures(dto.email);
      throw AuthError.InvalidCredentials();
    }

    await this.redisTokenService.resetLoginFailures(dto.email);

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((role) => role.name) ?? [],
    });

    await this.redisTokenService.storeRefreshToken(user.id, tokens.refreshToken);
    this.setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

    return this.usersService.toSafeUser(user);
  }

  async refresh(refreshToken: string, response: Response) {
    if (!refreshToken) {
      throw AuthError.NoTokenProvided();
    }

    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: envs.jwt.refreshSecret,
      });
    } catch {
      throw AuthError.InvalidToken();
    }

    const isValid = await this.redisTokenService.validateRefreshToken(payload.sub, refreshToken);

    if (!isValid) {
      throw AuthError.InvalidToken();
    }

    const user = await this.usersService.findById(payload.sub);
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    await this.redisTokenService.storeRefreshToken(user.id, tokens.refreshToken);
    this.setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

    return { refreshed: true };
  }

  async logout(userId: string, response: Response): Promise<void> {
    await this.redisTokenService.invalidateRefreshToken(userId);
    this.clearAuthCookies(response);
  }

  private async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: envs.jwt.accessSecret,
        expiresIn: RedisTTL.FIFTEEN_MINUTES,
      }),
      this.jwtService.signAsync(payload, {
        secret: envs.jwt.refreshSecret,
        expiresIn: RedisTTL.SEVEN_DAYS,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
    const commonOptions = this.getCookieOptions();

    response.cookie('accessToken', accessToken, {
      ...commonOptions,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refreshToken', refreshToken, {
      ...commonOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(response: Response): void {
    const commonOptions = this.getCookieOptions();

    response.clearCookie('accessToken', commonOptions);
    response.clearCookie('refreshToken', commonOptions);
  }

  private getCookieOptions() {
    return {
      httpOnly: true,
      secure: envs.nodeEnv === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}
