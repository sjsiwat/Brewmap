"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ApiError } from "@/lib/api";
import { safeNextPath, useAuth } from "@/lib/auth";

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
      return mode === "register"
        ? "Check the fields: a valid email, a name, and a password of 8–72 characters (about 24 in Thai)."
        : "Enter a valid email and your password.";
    default:
      return error.status >= 500
        ? "Something went wrong on our side. Try again in a moment."
        : error.message;
  }
}

const inputClass =
  "mt-2 w-full border-0 border-b border-ink bg-transparent px-0 py-2 text-base text-ink placeholder:text-muted focus:border-rust focus:outline-none focus:ring-0";
const labelClass = "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted";

export function AuthForm({ mode }: { mode: Mode }) {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
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

    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(email, password, String(form.get("displayName") ?? ""));
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
                maxLength={50}
                autoComplete="nickname"
                placeholder="What should we call you?"
                className={inputClass}
              />
            </label>
          )}
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              maxLength={72}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? "At least 8 characters" : undefined}
              className={inputClass}
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
