"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { heroSignals, heroMatch } from "@/lib/content";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="border border-line bg-paper-raised">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
          Match engine
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
          <span className="h-1.5 w-1.5 bg-rust" aria-hidden />
          Live read
        </span>
      </div>

      <motion.dl
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true }}
        variants={reduceMotion ? undefined : containerVariants}
      >
        {heroSignals.map((signal, i) => (
          <motion.div
            key={signal.label}
            variants={reduceMotion ? undefined : rowVariants}
            className={`flex items-baseline justify-between gap-4 px-5 py-3.5 ${
              i !== heroSignals.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              {signal.label}
            </dt>
            <dd className="text-right font-sans text-sm text-ink-soft">
              {signal.value}
            </dd>
          </motion.div>
        ))}
      </motion.dl>

      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href="/cafes"
          className="group flex items-center justify-between gap-4 border-t border-ink bg-ink px-5 py-4 transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
        >
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust-bright">
              {heroMatch.score}
            </p>
            <p className="mt-1 font-display text-lg text-paper">
              {heroMatch.name}
            </p>
            <p className="font-sans text-xs text-paper/60">{heroMatch.area}</p>
          </div>
          <ArrowUpRight
            className="shrink-0 text-paper/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            size={20}
            aria-hidden
          />
        </Link>
      </motion.div>
    </div>
  );
}
