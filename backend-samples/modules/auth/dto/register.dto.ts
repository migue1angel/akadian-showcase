import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsArray,
  ValidateIf,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ValidateIf((o) => !o.firebaseId)
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._-])[A-Za-z\d@$!%*?&#._-]{8,}$/,
    {
      message:
        'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&#._-)',
    },
  )
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  roleCodes: string[];

  @IsString()
  @IsOptional()
  firebaseId?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
