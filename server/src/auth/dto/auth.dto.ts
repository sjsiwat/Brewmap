import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  /** bcrypt only uses the first 72 bytes, so longer passwords are rejected. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;
}

export class LoginDto {
  @Transform(trim)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
