import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid credentials' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Invalid credentials' })
  password: string;
}