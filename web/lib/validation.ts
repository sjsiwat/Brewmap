/**
 * Mirrors the register rules in server/src/auth/dto/auth.dto.ts - keep the two
 * in sync. The server is the authority; these only give feedback before submit.
 */
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const NAME_MIN = 2;
export const NAME_MAX = 30;

const EMAIL_PATTERN =
  /^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const PASSWORD_CHARSET = /^[\x21-\x7E]+$/;
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'-]*$/u;

export type RegisterField = "displayName" | "email" | "password";
export type FieldErrors = Partial<Record<RegisterField, string>>;

export const normaliseEmail = (value: string) => value.trim().toLowerCase();
export const normaliseName = (value: string) => value.trim().replace(/\s+/g, " ");

export function emailError(raw: string): string | undefined {
  const email = normaliseEmail(raw);
  if (!email) return "Enter your email.";
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email))
    return "Enter a valid email address, like name@example.com.";
}

export function passwordError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (!PASSWORD_CHARSET.test(password))
    return "Use English letters, numbers and symbols only — no Thai, spaces or emoji.";
  if (!/[A-Za-z]/.test(password)) return "Include at least one English letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
}

export function nameError(raw: string): string | undefined {
  const name = normaliseName(raw);
  if (name.length < NAME_MIN) return `Use at least ${NAME_MIN} characters.`;
  if (name.length > NAME_MAX) return `Use at most ${NAME_MAX} characters.`;
  if (!NAME_PATTERN.test(name))
    return "Use letters (Thai or English), numbers, spaces and . _ - ' only.";
}

export function validateRegister(values: Record<RegisterField, string>): FieldErrors {
  const errors: FieldErrors = {
    displayName: nameError(values.displayName),
    email: emailError(values.email),
    password: passwordError(values.password),
  };
  for (const key of Object.keys(errors) as RegisterField[]) {
    if (!errors[key]) delete errors[key];
  }
  return errors;
}
