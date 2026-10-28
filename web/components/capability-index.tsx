import { format, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/reveal";

export function CapabilityIndex({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).home.capabilities;
  return (
    <section className="border-b border-line bg-paper-raised">
      <div className="page-container py-20 md:py-24">
        <Reveal>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 max-w-lg heading-section">
            {format(t.heading, { n: t.items.length })}
          </h2>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
          {t.items.map((capability, i) => (
            <Reveal
              as="li"
              key={capability.label}
              delay={Math.min(i * 0.04, 0.2)}
              className="flex items-baseline justify-between gap-6 border-t border-line py-5"
            >
                <span className="font-display text-lg text-ink">
                  {capability.label}
                </span>
                <span className="max-w-[14rem] text-right text-sm leading-snug text-ink-soft">
                  {capability.description}
                </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
