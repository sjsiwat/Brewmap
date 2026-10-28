import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/reveal";

export function Process({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).home.process;
  return (
    <section id="process" className="border-b border-line">
      <div className="page-container py-20 md:py-28">
        <Reveal>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 max-w-lg heading-section">{t.heading}</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {t.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <div
                className={`h-full pr-6 lg:pt-8 ${
                  i > 0 ? "lg:border-l lg:border-line lg:pl-8" : ""
                }`}
              >
                <span className="font-mono text-sm text-rust">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
