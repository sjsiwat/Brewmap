import { testimonial } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function Testimonial() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust lg:col-span-3">
              From a café owner
            </p>
            <figure className="lg:col-span-9">
              <blockquote className="max-w-2xl font-display text-2xl leading-snug tracking-tight text-ink sm:text-3xl">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 font-mono text-xs uppercase tracking-[0.1em] text-muted">
                {testimonial.name} — {testimonial.role}
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
