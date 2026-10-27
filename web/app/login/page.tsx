import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to BrewMap to see the cafés you saved.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col border-b border-line">
        {/* AuthForm reads ?next= with useSearchParams, so it renders on the client. */}
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
