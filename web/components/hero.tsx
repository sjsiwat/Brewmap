import { heroStats } from "@/lib/content";
import { HeroVisual } from "@/components/hero-visual";

export function Hero() {
  return (
    <section id="discover" className="border-b border-line">
      <div className="page-container grid grid-cols-1 gap-12 pt-16 pb-20 md:pt-24 md:pb-28 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="eyebrow">
            Café discovery — Chiang Mai
          </p>

          <h1 className="mt-6 max-w-xl font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Taste first.
            <br />
            Location second.
          </h1>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-soft">
            Most map apps sort cafés by distance and star rating. Tell BrewMap
            what you actually want — a quiet table to work at, matcha under
            150 baht, somewhere with parking near Nimman — and it picks real
            Chiang Mai cafés that fit, and says why.
          </p>

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-2xl text-ink">
                  {stat.value}
                </dt>
                <dd className="mt-1 font-mono text-[0.65rem] uppercase leading-tight tracking-[0.1em] text-muted">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5 lg:pt-2">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
