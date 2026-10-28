import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { navLinks } from "@/lib/content";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function SiteFooter({ lang }: { lang: Locale }) {
  const year = new Date().getFullYear();
  const t = getDictionary(lang);
  // The header keeps only search, saved and log in; the rest of the site lives here.
  const footerLinks = [
    { label: t.nav.findCafe, href: "/cafes" },
    ...navLinks.filter((link) => link.key !== "about").map((link) => ({ label: t.nav[link.key], href: link.href })),
    { label: t.nav.savedCafes, href: "/me/favorites" },
    { label: t.nav.about, href: "/about" },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-2xl">BrewMap</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">
              {t.footer.tagline}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/60">
              {t.footer.basedIn}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-paper/80">
              <MapPin size={14} aria-hidden />
              {t.footer.chiangMai}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/60">
              {t.footer.explore}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localePath(lang, link.href)}
                    className="focus-ring group inline-flex items-center gap-1.5 text-paper/80 transition-colors hover:text-rust-bright"
                  >
                    {link.label}
                    <ArrowUpRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-paper/15 pt-6 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} BrewMap</span>
          <span>{t.footer.motto}</span>
        </div>
      </div>
    </footer>
  );
}
