import { Reveal } from "@/components/reveal";

export function PointOfView() {
  return (
    <section className="border-b border-line bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust-bright">
            Our view
          </p>
          <p className="mt-8 max-w-4xl font-display text-3xl italic leading-[1.3] tracking-tight text-paper sm:text-4xl md:ml-16 md:text-5xl">
            Good products are not created by adding more. They are created by
            deciding what matters.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
