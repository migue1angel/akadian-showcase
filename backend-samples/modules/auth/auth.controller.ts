import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UseGuards,
  Get,
  UnauthorizedException,
  Delete,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import { Throttle } from '@nestjs/throttler';
import { RequestCodeDto } from './dto/request-code.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { User } from '../common/entities';
import { CurrentUser } from '../common/decorators';
import { envs } from '@/config/envs';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, Verify2FADto } from './dto/login.dto';
import { RedisService } from '../redis/redis.service';

@Controller('auth')
export class AuthController {
  private readonly LOGIN_IP_LIMIT = 5;
  private readonly LOGIN_IP_TTL_SECONDS = 60;
  private readonly REFRESH_IP_LIMIT = 10;
  private readonly REFRESH_IP_TTL_SECONDS = 60;
  private readonly REGISTER_IP_LIMIT = 5;
  private readonly REGISTER_IP_TTL_SECONDS = 60 * 60;

  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  @Post('register/request-code')
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @HttpCode(HttpStatus.OK)
  async requestRegisterCode(
    @Body() requestCodeDto: RequestCodeDto,
    @Req() request: Request,
  ) {
    await this.enforceRegisterIpLimit(request);
    await this.authService.requestRegisterCode(requestCodeDto.email);
    return { message: 'Verification code sent to email' };
  }

  @Post('register/verify')
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @HttpCode(HttpStatus.CREATED)
  async registerVerify(
    @Body() registerVerifyDto: RegisterVerifyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.enforceRegisterIpLimit(request);
    const metadata = this.extractMetadata(request);

    const result = await this.authService.verifyRegisterCode(
      registerVerifyDto,
      metadata,
    );

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { data: result.user, message: 'User registered successfully' };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    await this.enforceLoginIpLimit(request);
    return this.authService.login(loginDto);
  }

  @Post('login/complete')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  async completeLogin(
    @Body('tempToken') tempToken: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const metadata = this.extractMetadata(request);
    const result = await this.authService.completeLogin(tempToken, metadata);

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { data: result.user, message: 'Login successful' };
  }

  @Post('login/verify-2fa')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Body() verify2FADto: Verify2FADto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const metadata = this.extractMetadata(request);
    const result = await this.authService.verify2FA(verify2FADto, metadata);

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { data: result.user, message: 'Login successful' };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.enforceRefreshIpLimit(request);
    const refreshToken = request.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const metadata = this.extractMetadata(request);
    const result = await this.authService.refreshAccessToken(
      refreshToken,
      metadata,
    );

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { message: 'Token refreshed successfully' };
  }

  // Logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refreshToken'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.clearAuthCookies(response);

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(user.id);

    this.clearAuthCookies(response);

    return { message: 'Logged out from all devices' };
  }

  // ==================== SESSION MANAGEMENT ====================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: User) {
    const sessions = await this.authService.getUserSessions(user.id);

    const formattedSessions = sessions.map((session) => ({
      token: session.token.substring(0, 20) + '...',
      device: this.parseUserAgent(session.userAgent ?? 'Unknown'),
      ipAddress: session.ipAddress,
      createdAt: new Date(session.createdAt),
      lastUsedAt: new Date(session.lastUsedAt),
    }));

    return { data: formattedSessions };
  }

  @Delete('sessions/:token')
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: User,
    @Param('token') token: string,
  ) {
    return this.authService.revokeSession(user.id, token);
  }

  // ==================== PROFILE ====================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request: Request, @CurrentUser() user: User) {

    return { data: user, message: 'User profile fetched successfully' };
  }

  // @Get('google')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuth() {
  //   // Redirige a Google
  // }

  @Get('google')
  async googleRedirect(@Res() res: Response) {
    const state = await this.authService.createGoogleOAuthState();
    const params = new URLSearchParams({
      client_id: envs.GOOGLE_CLIENT_ID,
      redirect_uri: envs.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new UnauthorizedException('No code from Google');
    }

    await this.authService.validateGoogleOAuthState(state);

    const metadata = this.extractMetadata(req);

    const { accessToken } = await this.authService.exchangeGoogleCode(code);

    const profile = await this.authService.getGoogleProfile(accessToken);

    const user = await this.authService.findOrCreateGoogleUser(profile);

    const tokens = await this.authService.generateTokens(user, metadata);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.redirect(`${envs.FRONT_END_URL}/auth/success`);
  }

  // PRIVATE METHODS

  private extractMetadata(request: Request) {
    return {
      userAgent: request.headers['user-agent'] || 'Unknown',
      ipAddress: this.getClientIp(request),
    };
  }

  private parseUserAgent(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = envs.NODE_ENV === 'production';
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      ...(isProd && envs.COOKIE_DOMAIN ? { domain: envs.COOKIE_DOMAIN } : {}),
    };

    response.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(response: Response) {
    const isProd = envs.NODE_ENV === 'production';
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      ...(isProd && envs.COOKIE_DOMAIN ? { domain: envs.COOKIE_DOMAIN } : {}),
    };

    response.clearCookie('accessToken', cookieOptions);
    response.clearCookie('refreshToken', cookieOptions);
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string | undefined;
    const rawIp = forwarded?.split(',')[0]?.trim() || request.ip || '';
    return this.normalizeIPv4(rawIp) || '0.0.0.0';
  }

  private normalizeIPv4(ip: string): string {
    const regex = /(\d{1,3}\.){3}\d{1,3}/;
    const match = regex.exec(ip);
    return match ? match[0] : '';
  }

  private async enforceLoginIpLimit(request: Request) {
    const ip = this.getClientIp(request);
    const allowed = await this.redisService.checkFixedWindowLimit(
      `auth:login:ip:${ip}`,
      this.LOGIN_IP_LIMIT,
      this.LOGIN_IP_TTL_SECONDS,
    );

    if (!allowed) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async enforceRefreshIpLimit(request: Request) {
    const ip = this.getClientIp(request);
    const allowed = await this.redisService.checkSlidingWindowLimit(
      `auth:refresh:ip:${ip}`,
      this.REFRESH_IP_LIMIT,
      this.REFRESH_IP_TTL_SECONDS,
    );

    if (!allowed) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async enforceRegisterIpLimit(request: Request) {
    const ip = this.getClientIp(request);
    const allowed = await this.redisService.checkSlidingWindowLimit(
      `auth:register:ip:${ip}`,
      this.REGISTER_IP_LIMIT,
      this.REGISTER_IP_TTL_SECONDS,
    );

    if (!allowed) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
