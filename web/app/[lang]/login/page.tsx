import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";
import { AuthForm } from "@/components/auth-form";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang, t } = await pageLanguage(params);
  return {
    title: t.meta.loginTitle,
    description: t.meta.loginDescription,
    alternates: languageAlternates(lang, "/login"),
  };
}

export default async function LoginPage({ params }: LangParams) {
  const { lang } = await pageLanguage(params);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col border-b border-line">
        {/* AuthForm reads ?next= with useSearchParams, so it renders on the client. */}
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
