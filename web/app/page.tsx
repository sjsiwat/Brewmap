import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { FeatureShowcase } from "@/components/feature-showcase";
import { CapabilityIndex } from "@/components/capability-index";
import { Process } from "@/components/process";
import { FinalCta } from "@/components/final-cta";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div id="top" className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <FeatureShowcase />
        <CapabilityIndex />
        <Process />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
