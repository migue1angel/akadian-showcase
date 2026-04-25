import { UserRole } from '@/modules/common/entities';
import {
  IsEmail,
  IsString,
  Length,
  IsOptional,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterVerifyDto {
  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._-])[A-Za-z\d@$!%*?&#._-]{8,}$/, {
    message:
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&#._-)',
  })
  password: string;

  @IsOptional()
  role: UserRole;
}
