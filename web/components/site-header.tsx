"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { navLinks } from "@/lib/content";

/** Log in, or the user's name + saved cafés + log out. Empty while the session loads. */
function AccountLinks({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const { status, user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  if (status === "loading") return null;

  if (status === "anonymous") {
    return (
      <Link href="/login" onClick={onNavigate} className={mobile ? "py-4 font-display text-2xl text-ink" : "nav-link"}>
        Log in
      </Link>
    );
  }

  async function onLogout() {
    setLoggingOut(true);
    setLogoutFailed(false);
    try {
      await logout();
      onNavigate?.();
    } catch {
      // API unreachable: the cookie is still set, so stay logged in and say so.
      setLogoutFailed(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className={mobile ? "flex flex-col gap-1" : "flex items-center gap-5"}>
      <Link
        href="/me/favorites"
        onClick={onNavigate}
        className={mobile ? "flex items-center gap-3 border-b border-line py-4 font-display text-2xl text-ink" : `inline-flex items-center gap-1.5 nav-link`}
      >
        <Heart size={mobile ? 18 : 13} aria-hidden />
        Saved
      </Link>
      <span className={mobile ? "pt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted" : "sr-only"}>
        Logged in as {user?.displayName}
      </span>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        title={mobile ? undefined : `Logged in as ${user?.displayName}`}
        className={mobile ? "py-2 text-left font-mono text-xs uppercase tracking-[0.12em] text-ink-soft" : "nav-link"}
      >
        {loggingOut ? "Logging out…" : logoutFailed ? "Log out failed · retry" : "Log out"}
      </button>
    </div>
  );
}

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
      <div className="page-container flex items-center justify-between py-5">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink focus-ring"
        >
          BrewMap
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <AccountLinks />
          <Link
            href="/cafes"
            className="btn-outline"
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
          className="flex items-center justify-center text-ink lg:hidden focus-ring"
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
            className="overflow-hidden border-t border-line bg-paper lg:hidden"
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
              <AccountLinks mobile onNavigate={() => setIsMenuOpen(false)} />
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
