"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ApiError } from "@/lib/api";
import { safeNextPath, useAuth } from "@/lib/auth";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/en";
import {
  EMAIL_MAX,
  NAME_MAX,
  NAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  emailError,
  validateRegister,
  type FieldErrors,
  type RegisterField,
} from "@/lib/validation";

type Mode = "login" | "register";

type AuthText = Dictionary["auth"];

function errorText(error: unknown, mode: Mode, t: AuthText["errors"]): string {
  if (!(error instanceof ApiError)) return t.generic;
  switch (error.status) {
    case 0:
      return t.offline;
    case 401:
      return t.badLogin;
    case 409:
      return t.taken;
    case 429:
      return t.rateLimited;
    case 400:
      // Register: the server's own rule message (English), e.g. "Password must
      // include at least one number". Login: a bad value can't match any account anyway.
      return mode === "register" ? error.message : t.badLogin;
    default:
      return error.status >= 500 ? t.server : error.message;
  }
}

const inputClass =
  "mt-2 w-full border-0 border-b border-ink bg-transparent px-0 py-2 text-base text-ink placeholder:text-muted focus:border-rust focus:outline-none focus:ring-0";
const labelClass = "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted";
const hintClass = "mt-2 block text-xs text-muted";
const fieldErrorClass = "mt-2 block text-xs text-rust";

function hints(t: AuthText): Record<RegisterField, string> {
  return {
    displayName: format(t.hints.displayName, { max: NAME_MAX }),
    email: t.hints.email,
    password: format(t.hints.password, { min: PASSWORD_MIN, max: PASSWORD_MAX }),
  };
}

/** A validation key from lib/validation.ts, in the page's language. */
function fieldMessage(key: FieldErrors[RegisterField], t: AuthText): string | undefined {
  if (!key) return undefined;
  const isName = key.startsWith("name");
  return format(t.validation[key], {
    min: isName ? NAME_MIN : PASSWORD_MIN,
    max: isName ? NAME_MAX : PASSWORD_MAX,
  });
}

export function AuthForm({ mode }: { mode: Mode }) {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const { t: dict, href } = useI18n();
  const t = dict.auth;
  const HINTS = hints(t);
  const next = safeNextPath(useSearchParams().get("next"), href("/cafes"));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const copy = t[mode];

  // Already logged in (e.g. opened /login in a second tab) - nothing to do here.
  useEffect(() => {
    if (status === "authenticated" && !submitting) router.replace(next);
  }, [status, submitting, next, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "");

    const errors: FieldErrors =
      mode === "register"
        ? validateRegister({ displayName, email, password })
        : { email: emailError(email), password: password ? undefined : "passwordRequired" };
    if (!errors.email) delete errors.email;
    if (!errors.password) delete errors.password;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(null);
      const first = (["displayName", "email", "password"] as const).find((f) => errors[f]);
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
      router.replace(next);
    } catch (err) {
      setError(errorText(err, mode, t.errors));
      setSubmitting(false);
    }
  }

  const otherHref = href(
    `${mode === "login" ? "/register" : "/login"}${next === href("/cafes") ? "" : `?next=${encodeURIComponent(next)}`}`,
  );

  return (
    <div className="page-container grid grid-cols-1 gap-12 py-16 md:grid-cols-12 md:gap-6 md:py-24">
      <div className="md:col-span-5">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="mt-6 heading-page">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">{copy.body}</p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="border-t border-ink pt-8 md:col-span-6 md:col-start-7"
      >
        <div className="flex flex-col gap-8">
          {mode === "register" && (
            <label className="block">
              <span className={labelClass}>{t.name}</span>
              <input
                name="displayName"
                type="text"
                required
                maxLength={NAME_MAX + 20}
                autoComplete="nickname"
                placeholder={t.namePlaceholder}
                aria-invalid={fieldErrors.displayName ? true : undefined}
                aria-describedby="displayName-note"
                className={inputClass}
              />
              <FieldNote id="displayName-note" error={fieldMessage(fieldErrors.displayName, t)} hint={HINTS.displayName} />
            </label>
          )}
          <label className="block">
            <span className={labelClass}>{t.email}</span>
            <input
              name="email"
              type="email"
              required
              maxLength={EMAIL_MAX}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby="email-note"
              className={inputClass}
            />
            <FieldNote
              id="email-note"
              error={fieldMessage(fieldErrors.email, t)}
              hint={mode === "register" ? HINTS.email : undefined}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t.password}</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? PASSWORD_MIN : undefined}
              maxLength={PASSWORD_MAX}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? format(t.passwordPlaceholder, { min: PASSWORD_MIN }) : undefined}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby="password-note"
              className={inputClass}
            />
            <FieldNote
              id="password-note"
              error={fieldMessage(fieldErrors.password, t)}
              hint={mode === "register" ? HINTS.password : undefined}
            />
          </label>
        </div>

        <p role="alert" aria-live="assertive" className="mt-6 min-h-5 text-sm text-rust">
          {error}
        </p>

        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-between gap-6 bg-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-rust disabled:cursor-wait disabled:opacity-70 focus-ring"
          >
            {submitting ? copy.busy : copy.submit}
            <ArrowUpRight size={16} aria-hidden />
          </button>
          <p className="text-sm text-ink-soft">
            {mode === "login" ? t.noAccount : t.haveAccount}
            <Link
              href={otherHref}
              className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-rust hover:decoration-rust focus-ring"
            >
              {mode === "login" ? t.createOne : t.logIn}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

/** The rule under a field, swapped for the problem once the user has tried to submit. */
function FieldNote({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <span id={id} className={fieldErrorClass}>
        {error}
      </span>
    );
  }
  return hint ? (
    <span id={id} className={hintClass}>
      {hint}
    </span>
  ) : null;
}
