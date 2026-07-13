import { processSteps } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Process() {
  return (
    <section id="process" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust">
            How it works
          </p>
          <h2 className="mt-4 max-w-lg font-display text-3xl tracking-tight text-ink sm:text-4xl">
            We don&apos;t start with a map. We start with a craving.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {processSteps.map((step, i) => (
            <Reveal key={step.index} delay={i * 0.08}>
              <div
                className={`h-full pr-6 lg:pt-8 ${
                  i > 0 ? "lg:border-l lg:border-line lg:pl-8" : ""
                }`}
              >
                <span className="font-mono text-sm text-rust">
                  {step.index}
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
