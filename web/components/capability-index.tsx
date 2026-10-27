import { capabilities } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function CapabilityIndex() {
  return (
    <section className="border-b border-line bg-paper-raised">
      <div className="page-container py-20 md:py-24">
        <Reveal>
          <p className="eyebrow">
            Signals we read
          </p>
          <h2 className="mt-4 max-w-lg heading-section">
            {capabilities.length} things we match on.
          </h2>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
          {capabilities.map((capability, i) => (
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
