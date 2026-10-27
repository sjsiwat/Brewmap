import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const normaliseEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Inner runs of whitespace become one space: "  Ploy   P. " -> "Ploy P."
const normaliseName = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

/** Mirrored in web/lib/validation.ts - keep the two in sync. */
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
// bcrypt hashes at most 72 bytes; with ASCII-only passwords that is 72 characters.
export const PASSWORD_MAX = 72;
export const NAME_MIN = 2;
export const NAME_MAX = 30;

// Plain ASCII address: local part of letters, digits and . _ % + -, no leading,
// trailing or double dots; a domain of dot-separated labels (no leading/trailing
// hyphen) ending in a 2+ letter TLD. IsEmail runs too, for the finer RFC rules.
const EMAIL_PATTERN =
  /^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const EMAIL_OPTIONS = {
  allow_utf8_local_part: false,
  require_tld: true,
  allow_ip_domain: false,
  allow_display_name: false,
};
const EMAIL_MESSAGE = 'Enter a valid email address, like name@example.com';

// Printable ASCII without spaces: English letters, digits and symbols. No Thai,
// emoji or other scripts, so the bcrypt 72-byte limit is exactly 72 characters.
const PASSWORD_CHARSET = /^[\x21-\x7E]+$/;
const PASSWORD_LETTER = /[A-Za-z]/;
const PASSWORD_DIGIT = /[0-9]/;

// Letters (any script, incl. Thai with its vowel/tone marks), digits, single
// spaces and . _ - ' - starting with a letter or digit. No emoji, symbols or <>.
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'-]*$/u;

export class RegisterDto {
  @Transform(normaliseEmail)
  @IsString()
  @MaxLength(EMAIL_MAX)
  @IsEmail(EMAIL_OPTIONS, { message: EMAIL_MESSAGE })
  @Matches(EMAIL_PATTERN, { message: EMAIL_MESSAGE })
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN, {
    message: `Password must be at least ${PASSWORD_MIN} characters`,
  })
  @MaxLength(PASSWORD_MAX, {
    message: `Password must be at most ${PASSWORD_MAX} characters`,
  })
  @Matches(PASSWORD_CHARSET, {
    message:
      'Password can only use English letters, numbers and symbols (no Thai, spaces or emoji)',
  })
  @Matches(PASSWORD_LETTER, {
    message: 'Password must include at least one English letter',
  })
  @Matches(PASSWORD_DIGIT, {
    message: 'Password must include at least one number',
  })
  password: string;

  @Transform(normaliseName)
  @IsString()
  @MinLength(NAME_MIN, {
    message: `Name must be at least ${NAME_MIN} characters`,
  })
  @MaxLength(NAME_MAX, {
    message: `Name must be at most ${NAME_MAX} characters`,
  })
  @Matches(NAME_PATTERN, {
    message:
      "Name can use letters (Thai or English), numbers, spaces and . _ - ' only",
  })
  displayName: string;
}

export class LoginDto {
  @Transform(normaliseEmail)
  @IsString()
  @MaxLength(EMAIL_MAX)
  @IsEmail(EMAIL_OPTIONS, { message: EMAIL_MESSAGE })
  @Matches(EMAIL_PATTERN, { message: EMAIL_MESSAGE })
  email: string;

  // Loose on purpose: a wrong password should get the same 401 as any other,
  // but nothing longer than bcrypt can compare, and nothing outside ASCII.
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX)
  @Matches(PASSWORD_CHARSET)
  password: string;
}
