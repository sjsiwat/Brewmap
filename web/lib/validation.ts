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
/** A key of the dictionary's auth.validation; the form shows it in the page's language. */
export type ValidationError =
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordShort"
  | "passwordLong"
  | "passwordCharset"
  | "passwordLetter"
  | "passwordNumber"
  | "nameShort"
  | "nameLong"
  | "nameCharset";
export type FieldErrors = Partial<Record<RegisterField, ValidationError>>;

export const normaliseEmail = (value: string) => value.trim().toLowerCase();
export const normaliseName = (value: string) => value.trim().replace(/\s+/g, " ");

export function emailError(raw: string): ValidationError | undefined {
  const email = normaliseEmail(raw);
  if (!email) return "emailRequired";
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) return "emailInvalid";
}

export function passwordError(password: string): ValidationError | undefined {
  if (password.length < PASSWORD_MIN) return "passwordShort";
  if (password.length > PASSWORD_MAX) return "passwordLong";
  if (!PASSWORD_CHARSET.test(password)) return "passwordCharset";
  if (!/[A-Za-z]/.test(password)) return "passwordLetter";
  if (!/[0-9]/.test(password)) return "passwordNumber";
}

export function nameError(raw: string): ValidationError | undefined {
  const name = normaliseName(raw);
  if (name.length < NAME_MIN) return "nameShort";
  if (name.length > NAME_MAX) return "nameLong";
  if (!NAME_PATTERN.test(name)) return "nameCharset";
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
