import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// bcrypt only hashes the first 72 *bytes*. Counting characters let a 30-letter
// Thai password (90 bytes) through, and any password sharing its first 72 bytes
// then logged in. Thai letters are 3 bytes in UTF-8, so this is about 24 of them.
const BCRYPT_MAX_BYTES = 72;

function MaxBytes(max: number, options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'maxBytes',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= max,
        defaultMessage: (args) =>
          `${args?.property ?? 'value'} must be at most ${max} bytes (about ${Math.floor(max / 3)} Thai characters)`,
      },
    },
    options,
  );
}

export class RegisterDto {
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxBytes(BCRYPT_MAX_BYTES)
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
  @MaxBytes(BCRYPT_MAX_BYTES)
  password: string;
}
