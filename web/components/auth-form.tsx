"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ApiError } from "@/lib/api";
import { safeNextPath, useAuth } from "@/lib/auth";
import {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  emailError,
  validateRegister,
  type FieldErrors,
  type RegisterField,
} from "@/lib/validation";

type Mode = "login" | "register";

const COPY: Record<
  Mode,
  { eyebrow: string; title: string; body: string; submit: string; busy: string }
> = {
  login: {
    eyebrow: "Welcome back",
    title: "Log in to keep your shortlist.",
    body: "Your saved cafés follow you between visits — the creamy latte place, the quiet one with parking, the matcha bar you meant to try.",
    submit: "Log in",
    busy: "Logging in…",
  },
  register: {
    eyebrow: "New to BrewMap",
    title: "Start a shortlist of cafés worth the trip.",
    body: "An account lets you save cafés as you browse and come back to them later. Email and a password are all it takes.",
    submit: "Create account",
    busy: "Creating account…",
  },
};

function errorText(error: unknown, mode: Mode): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Try again.";
  switch (error.status) {
    case 0:
      return "Can't reach BrewMap right now. Try again in a moment.";
    case 401:
      return "That email and password don't match an account.";
    case 409:
      return "That email already has an account — log in instead.";
    case 429:
      return "Too many attempts. Wait a minute, then try again.";
    case 400:
      // Register: the server's own rule message, e.g. "Password must include at
      // least one number". Login: a bad value can't match any account anyway.
      return mode === "register"
        ? error.message
        : "That email and password don't match an account.";
    default:
      return error.status >= 500
        ? "Something went wrong on our side. Try again in a moment."
        : error.message;
  }
}

const inputClass =
  "mt-2 w-full border-0 border-b border-ink bg-transparent px-0 py-2 text-base text-ink placeholder:text-muted focus:border-rust focus:outline-none focus:ring-0";
const labelClass = "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted";
const hintClass = "mt-2 block text-xs text-muted";
const fieldErrorClass = "mt-2 block text-xs text-rust";

const HINTS: Record<RegisterField, string> = {
  displayName: `2–${NAME_MAX} letters (Thai or English), numbers, spaces and . _ - '`,
  email: "An address like name@example.com",
  password: `${PASSWORD_MIN}–${PASSWORD_MAX} English letters, numbers or symbols, with at least one letter and one number. No Thai.`,
};

export function AuthForm({ mode }: { mode: Mode }) {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

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
        : { email: emailError(email), password: password ? undefined : "Enter your password." };
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
      setError(errorText(err, mode));
      setSubmitting(false);
    }
  }

  const otherHref = `${mode === "login" ? "/register" : "/login"}${
    next === "/cafes" ? "" : `?next=${encodeURIComponent(next)}`
  }`;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-12 md:gap-6 md:px-10 md:py-24">
      <div className="md:col-span-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust">{copy.eyebrow}</p>
        <h1 className="mt-6 font-display text-4xl tracking-tight text-ink sm:text-5xl">
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
              <span className={labelClass}>Name</span>
              <input
                name="displayName"
                type="text"
                required
                maxLength={NAME_MAX + 20}
                autoComplete="nickname"
                placeholder="What should we call you?"
                aria-invalid={fieldErrors.displayName ? true : undefined}
                aria-describedby="displayName-note"
                className={inputClass}
              />
              <FieldNote id="displayName-note" error={fieldErrors.displayName} hint={HINTS.displayName} />
            </label>
          )}
          <label className="block">
            <span className={labelClass}>Email</span>
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
              error={fieldErrors.email}
              hint={mode === "register" ? HINTS.email : undefined}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? PASSWORD_MIN : undefined}
              maxLength={PASSWORD_MAX}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? `At least ${PASSWORD_MIN} characters` : undefined}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby="password-note"
              className={inputClass}
            />
            <FieldNote
              id="password-note"
              error={fieldErrors.password}
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
            className="inline-flex items-center justify-between gap-6 bg-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-rust disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
          >
            {submitting ? copy.busy : copy.submit}
            <ArrowUpRight size={16} aria-hidden />
          </button>
          <p className="text-sm text-ink-soft">
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <Link
              href={otherHref}
              className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-rust hover:decoration-rust focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
            >
              {mode === "login" ? "Create one" : "Log in"}
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
