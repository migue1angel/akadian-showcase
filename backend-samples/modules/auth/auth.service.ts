import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../common/entities';
import { RegisterVerifyDto } from './dto';
import { envs } from '@/config/envs';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/services/mail.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, Verify2FADto } from './dto/login.dto';
import { SessionMetadata } from '../redis/interfaces';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly LOGIN_MAX_ATTEMPTS = 5;
  private readonly LOGIN_LOCK_SECONDS = 15 * 60;
  private readonly REFRESH_RATE_LIMIT = 10;
  private readonly REFRESH_RATE_WINDOW_SECONDS = 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  private async hashPassword(password: string) {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async requestRegisterCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException(
        'Email already registered. Please login instead.',
      );
    }

    const code = this.generateCode();
    await this.redisService.saveVerificationCode(
      normalizedEmail,
      code,
      'register',
      300,
    );

    await this.mailService.sendVerificationCode(normalizedEmail, code, 'register');
    return true;
  }

  async verifyRegisterCode(
    registerVerifyDto: RegisterVerifyDto,
    metadata: SessionMetadata,
  ) {
    const { email, code, firstName, lastName, password } = registerVerifyDto;
    const normalizedEmail = this.normalizeEmail(email);
    const verificationCode = await this.redisService.getVerificationCode(
      normalizedEmail,
      'register',
    );

    if (verificationCode?.code !== code) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.createStudent({
      email: normalizedEmail,
      firstName,
      lastName,
      password: await this.hashPassword(password),
    });
    await this.redisService.deleteVerificationCode(normalizedEmail, 'register');
    const tokens = await this.generateTokens(user, metadata);
    const fullUser = await this.usersService.findOne(user.id);
    return {
      user: fullUser,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = this.normalizeEmail(email);

    const isLocked = await this.redisService.isLoginLocked(normalizedEmail);
    if (isLocked) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user?.password) {
      await this.redisService.incrementLoginFailures(
        normalizedEmail,
        this.LOGIN_MAX_ATTEMPTS,
        this.LOGIN_LOCK_SECONDS,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      await this.redisService.incrementLoginFailures(
        normalizedEmail,
        this.LOGIN_MAX_ATTEMPTS,
        this.LOGIN_LOCK_SECONDS,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      await this.redisService.resetLoginFailures(normalizedEmail);
      throw new UnauthorizedException('Please verify your email first');
    }

    // Si el usuario tiene 2FA activado, enviar código
    if (user.twoFactorEnabled) {
      const code = this.generateCode();
      await this.redisService.resetLoginFailures(normalizedEmail);
      await this.redisService.saveVerificationCode(
        normalizedEmail,
        code,
        '2fa',
        300,
      );
      await this.mailService.sendVerificationCode(normalizedEmail, code, '2fa');

      return {
        requires2FA: true,
        message: '2FA code sent to email',
      };
    }

    await this.redisService.resetLoginFailures(normalizedEmail);

    // Login directo sin 2FA
    return {
      requires2FA: false,
      tempToken: await this.generateTempToken(user),
    };
  }

  async verify2FA(verify2FADto: Verify2FADto, metadata: SessionMetadata) {
    const { email, code } = verify2FADto;
    const normalizedEmail = this.normalizeEmail(email);

    const storedCode = await this.redisService.getVerificationCode(
      normalizedEmail,
      '2fa',
    );

    if (storedCode?.code !== code) {
      throw new UnauthorizedException('Invalid or expired 2FA code');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.redisService.deleteVerificationCode(normalizedEmail, '2fa');

    const tokens = await this.generateTokens(user, metadata);

    return {
      user,
      ...tokens,
    };
  }

  async completeLogin(tempToken: string, metadata: SessionMetadata) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(tempToken, {
        secret: envs.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid temporary token');
    }

    const user = await this.usersService.findOne(payload.sub);
    const tokens = await this.generateTokens(user, metadata);

    const fullUser = await this.usersService.findOne(user.id);
    return {
      user: fullUser,
      ...tokens,
    };
  }

  // generateGoogleTokens(user: User, metadata: SessionMetadata) {
  //   return this.generateTokens(user, metadata);
  // }

  async exchangeGoogleCode(code: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: envs.GOOGLE_CLIENT_ID,
        client_secret: envs.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: envs.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      throw new UnauthorizedException('Invalid Google token');
    }

    return {
      accessToken: data.access_token,
    };
  }

  async getGoogleProfile(accessToken: string) {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.json();
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    const email = profile.email;
    const googleId = profile.sub;

    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      user = await this.usersService.findByEmail(email);

      if (user) {
        user = await this.usersService.update(user.id, {
          googleId,
          imageUrl: profile.picture,
        });
      } else {
        user = await this.usersService.createStudent({
          email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          googleId,
          emailVerified: true,
          imageUrl: profile.picture,
        });
      }
    }

    return user;
  }

  private async generateTempToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'temp',
    };

    return this.jwtService.signAsync(payload, {
      secret: envs.JWT_ACCESS_SECRET,
      expiresIn: '5m',
    });
  }

  // Generar Access y Refresh Tokens
  public async generateTokens(user: User, metadata: SessionMetadata) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: envs.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: envs.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    await this.redisService.saveRefreshToken(
      user.id,
      refreshToken,
      metadata,
      604800, // 7 days
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string, metadata: SessionMetadata) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: envs.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userRateKey = `auth:refresh:user:${payload.sub}`;
    const allowed = await this.redisService.checkSlidingWindowLimit(
      userRateKey,
      this.REFRESH_RATE_LIMIT,
      this.REFRESH_RATE_WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const tokenData = await this.redisService.getRefreshToken(refreshToken);

    if (!tokenData) {
      throw new UnauthorizedException('Refresh token not found or revoked');
    }

    const user = await this.usersService.findOne(payload.sub);

    // Generar nuevo access token
    const newAccessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      {
        secret: envs.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );

    // Generar nuevo refresh token (rotación)
    const newRefreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      {
        secret: envs.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );

    // Rotar refresh token
    await this.redisService.rotateRefreshToken(
      refreshToken,
      newRefreshToken,
      metadata,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await this.redisService.revokeRefreshToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.redisService.revokeAllUserTokens(userId);
    return { message: 'Logged out from all devices' };
  }

  async getUserSessions(userId: string) {
    return this.redisService.getUserSessions(userId);
  }

  async revokeSession(userId: string, token: string) {
    const tokenData = await this.redisService.getRefreshToken(token);

    if (tokenData?.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.redisService.revokeRefreshToken(token);
    return { message: 'Session revoked successfully' };
  }

  async validateUser(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  async createGoogleOAuthState(): Promise<string> {
    const state = randomBytes(16).toString('hex');
    await this.redisService.saveOAuthState(state, 600);
    return state;
  }

  async validateGoogleOAuthState(state: string): Promise<void> {
    if (!state) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const valid = await this.redisService.consumeOAuthState(state);
    if (!valid) {
      throw new UnauthorizedException('Invalid OAuth state');
    }
  }
}
