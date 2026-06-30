import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { AuthService } from '../services/auth/auth.service';
import { UsersService } from '../services/users.service';

import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('IAM')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(dto, response);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(req.cookies?.refreshToken, response);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(200)
  async logout(
    @CurrentUser() user: TokenPayload,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user.sub, response);
    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Return current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: TokenPayload) {
    return this.usersService.findById(user.sub);
  }
}
