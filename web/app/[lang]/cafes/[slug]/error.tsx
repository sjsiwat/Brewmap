"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { ArrowLeft, RotateCw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n/client";

export default function CafeError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { lang, t, href } = useI18n();
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-line">
          <div
            role="alert"
            className="page-container py-16 md:py-20"
          >
            <p className="eyebrow">{t.cafeError.eyebrow}</p>
            <h1 className="mt-4 max-w-xl heading-section">{t.cafeError.heading}</h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-soft">{t.cafeError.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="inline-flex items-center gap-2 border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper focus-ring"
              >
                <RotateCw size={14} aria-hidden />
                {t.cafeError.tryAgain}
              </button>
              <Link
                href={href("/cafes")}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-muted transition-colors hover:text-rust focus-ring"
              >
                <ArrowLeft size={14} aria-hidden />
                {t.cafeError.allCafes}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
