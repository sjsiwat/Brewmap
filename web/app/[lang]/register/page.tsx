import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";
import { AuthForm } from "@/components/auth-form";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang, t } = await pageLanguage(params);
  return {
    title: t.meta.registerTitle,
    description: t.meta.registerDescription,
    alternates: languageAlternates(lang, "/register"),
  };
}

export default async function RegisterPage({ params }: LangParams) {
  const { lang } = await pageLanguage(params);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col border-b border-line">
        {/* AuthForm reads ?next= with useSearchParams, so it renders on the client. */}
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
