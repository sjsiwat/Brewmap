"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { features } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function FeatureShowcase() {
  return (
    <section id="features" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">
              What BrewMap
              <br />
              actually does
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft md:text-right">
              Six systems, each solving one specific part of &ldquo;where should
              I get coffee today.&rdquo;
            </p>
          </div>
        </Reveal>

        <div className="mt-14 border-t border-ink">
          {features.map((feature, i) => (
            <Reveal key={feature.index} delay={Math.min(i * 0.05, 0.3)}>
              <motion.div
                whileHover="hover"
                initial="rest"
                animate="rest"
                className="group grid grid-cols-1 gap-3 border-b border-line py-7 md:grid-cols-12 md:items-baseline md:gap-6"
              >
                <span className="font-mono text-sm text-muted md:col-span-1">
                  {feature.index}
                </span>

                <motion.h3
                  variants={{ rest: { x: 0 }, hover: { x: 6 } }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-2xl text-ink md:col-span-4"
                >
                  {feature.name}
                </motion.h3>

                <p className="text-sm leading-relaxed text-ink-soft md:col-span-4">
                  {feature.description}
                </p>

                <div className="flex items-center justify-between gap-2 md:col-span-3 md:flex-col md:items-end md:text-right">
                  <div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                      {feature.category}
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-rust">
                      {feature.status}
                    </p>
                  </div>
                  <motion.span
                    variants={{ rest: { opacity: 0, x: -4 }, hover: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.25 }}
                    className="hidden text-rust md:block"
                    aria-hidden
                  >
                    <ArrowUpRight size={18} />
                  </motion.span>
                </div>

                <p className="text-xs italic leading-relaxed text-muted md:col-span-12">
                  {feature.result}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
