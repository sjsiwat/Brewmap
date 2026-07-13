"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/content";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isScrolled
          ? "bg-paper/95 backdrop-blur-sm border-line"
          : "bg-paper border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
        >
          BrewMap
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-rust focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/cafes"
            className="border border-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:border-rust hover:bg-rust hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
          >
            Find your café
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="flex items-center justify-center text-ink md:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <nav
              aria-label="Mobile"
              className="flex flex-col gap-1 px-6 py-6"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="border-b border-line py-4 font-display text-2xl text-ink"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/cafes"
                onClick={() => setIsMenuOpen(false)}
                className="mt-6 border border-ink px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.12em] text-ink"
              >
                Find your café
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
