import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { footerSocials } from "@/lib/content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-2xl">BrewMap</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">
              Built for people who know what a good cup tastes like, and
              don&apos;t want to gamble on the next one.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/40">
              Contact
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2 text-paper/80">
                <Mail size={14} aria-hidden />
                hello@brewmap.co
              </li>
              <li className="flex items-center gap-2 text-paper/80">
                <MapPin size={14} aria-hidden />
                Chiang Mai, Thailand
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/40">
              Elsewhere
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {footerSocials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1.5 text-paper/80 transition-colors hover:text-rust focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
                  >
                    {social.label}
                    <ArrowUpRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-paper/15 pt-6 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} BrewMap</span>
          <span>Taste first. Location second.</span>
        </div>
      </div>
    </footer>
  );
}
