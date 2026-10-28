"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format, locales, switchLocalePath } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

/** Log in, or log out for a signed-in user. Empty while the session loads. */
function AccountLink() {
  const { status, user, logout } = useAuth();
  const { t, href } = useI18n();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  if (status === "loading") return null;

  if (status === "anonymous") {
    return (
      <Link href={href("/login")} className="nav-link">
        {t.nav.logIn}
      </Link>
    );
  }

  async function onLogout() {
    setLoggingOut(true);
    setLogoutFailed(false);
    try {
      await logout();
    } catch {
      // API unreachable: the cookie is still set, so stay logged in and say so.
      setLogoutFailed(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loggingOut}
      title={format(t.nav.loggedInAs, { name: user?.displayName ?? "" })}
      className="nav-link"
    >
      <span className="sr-only">{format(t.nav.loggedInAs, { name: user?.displayName ?? "" })}. </span>
      {loggingOut ? t.nav.loggingOut : logoutFailed ? t.nav.retryLogOut : t.nav.logOut}
    </button>
  );
}

/** Off the café list: a box that takes you there with your search (on the list, its own box stays pinned). */
function HeaderSearch() {
  const router = useRouter();
  const { t, href } = useI18n();
  const [text, setText] = useState("");

  return (
    <>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const search = text.trim();
          router.push(href(search ? `/cafes?search=${encodeURIComponent(search)}` : "/cafes"));
        }}
        className="hidden w-72 items-center gap-2 border border-line bg-paper-raised px-3 focus-within:border-ink focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rust md:flex lg:w-80"
      >
        <Search size={14} className="shrink-0 text-muted" aria-hidden />
        <label htmlFor="header-search" className="sr-only">
          {t.nav.headerSearchLabel}
        </label>
        <input
          id="header-search"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={300}
          enterKeyHint="search"
          placeholder={t.nav.headerSearchPlaceholder}
          className="w-full min-w-0 border-0 bg-transparent py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-0"
        />
      </form>
      <Link href={href("/cafes")} aria-label={t.nav.searchCafes} className="p-1 text-ink md:hidden focus-ring">
        <Search size={20} aria-hidden />
      </Link>
    </>
  );
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { lang, t, href } = useI18n();
  const otherLang = locales.find((locale) => locale !== lang) ?? lang;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isScrolled ? "border-line bg-paper/95 backdrop-blur-sm" : "border-transparent bg-paper"
      }`}
    >
      {/* Fixed height: the café list pins its search box right below (top-16). */}
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link href={href("/")} className="font-display text-xl tracking-tight text-ink focus-ring">
          BrewMap
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {pathname !== href("/cafes") && <HeaderSearch />}
          <Link href={href("/me/favorites")} className="inline-flex items-center gap-1.5 nav-link max-sm:-m-2 max-sm:p-2">
            <Heart size={15} aria-hidden />
            <span className="max-sm:sr-only">{t.nav.saved}</span>
          </Link>
          <AccountLink />
          {/* Same page in the other language. A plain <a>: the root layout (and <html lang>) changes. */}
          <a
            href={switchLocalePath(pathname, otherLang)}
            hrefLang={otherLang}
            lang={otherLang}
            title={t.nav.switchLanguage}
            className="nav-link normal-case"
          >
            {t.nav.otherLanguage}
          </a>
        </div>
      </div>
    </header>
  );
}
