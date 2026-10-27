"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { features } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function FeatureShowcase() {
  return (
    <section id="features" className="border-b border-line">
      <div className="page-container py-20 md:py-28">
        <Reveal>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="heading-page">
              What BrewMap
              <br />
              actually does
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft md:text-right">
              {features.length} things you can use today. Pick one to try it.
            </p>
          </div>
        </Reveal>

        <ul className="mt-14 border-t border-ink">
          {features.map((feature, i) => (
            <Reveal as="li" key={feature.index} delay={Math.min(i * 0.05, 0.3)}>
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <Link
                    href={feature.href}
                    className="focus-ring group grid grid-cols-1 gap-3 border-b border-line py-7 transition-colors hover:bg-paper-raised md:grid-cols-12 md:items-baseline md:gap-6 md:px-3"
                  >
                    <span className="font-mono text-sm text-muted md:col-span-1">{feature.index}</span>

                    <motion.h3
                      variants={{ rest: { x: 0 }, hover: { x: 6 } }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="font-display text-2xl text-ink md:col-span-4"
                    >
                      {feature.name}
                    </motion.h3>

                    <p className="text-sm leading-relaxed text-ink-soft md:col-span-4">{feature.description}</p>

                    <div className="flex items-center justify-between gap-2 md:col-span-3 md:flex-col md:items-end md:text-right">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                        {feature.category}
                      </p>
                      <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-rust group-hover:underline">
                        {feature.cta}
                        <ArrowUpRight size={14} aria-hidden />
                      </span>
                    </div>

                    <p className="text-xs italic leading-relaxed text-muted md:col-span-11 md:col-start-2">
                      {feature.detail}
                    </p>
                  </Link>
                </motion.div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
