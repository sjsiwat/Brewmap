import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a BrewMap account to save cafés as you browse.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col border-b border-line">
        {/* AuthForm reads ?next= with useSearchParams, so it renders on the client. */}
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
