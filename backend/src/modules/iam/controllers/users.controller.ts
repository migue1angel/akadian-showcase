import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { UsersService } from '../services/users.service';

import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('IAM')
@ApiCookieAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiResponse({ status: 200, description: 'Return current user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: TokenPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('profile')
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch('password')
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload or incorrect current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: TokenPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, dto);
  }
}
