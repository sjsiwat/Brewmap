import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AboutContent } from "@/components/about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why BrewMap exists, and who built it — a solo prototype by Siwat Jankam.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <AboutContent />
      </main>
      <SiteFooter />
    </div>
  );
}
