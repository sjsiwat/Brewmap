import { aboutCopy, aboutFacts } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function AboutContent() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust">
              {aboutCopy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-xl font-display text-4xl tracking-tight text-ink sm:text-5xl">
              {aboutCopy.heading}
            </h1>

            <div className="mt-8 max-w-xl space-y-5">
              {aboutCopy.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <dl className="border-t border-ink">
              {aboutFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-4"
                >
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
                    {fact.label}
                  </dt>
                  <dd className="text-right font-display text-lg text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
