"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Log in, or log out for a signed-in user. Empty while the session loads. */
function AccountLink() {
  const { status, user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  if (status === "loading") return null;

  if (status === "anonymous") {
    return (
      <Link href="/login" className="nav-link">
        Log in
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
      title={`Logged in as ${user?.displayName}`}
      className="nav-link"
    >
      <span className="sr-only">Logged in as {user?.displayName}. </span>
      {loggingOut ? "Logging out…" : logoutFailed ? "Retry log out" : "Log out"}
    </button>
  );
}

/** Off the café list: a box that takes you there with your search (on the list, its own box stays pinned). */
function HeaderSearch() {
  const router = useRouter();
  const [text, setText] = useState("");

  return (
    <>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const search = text.trim();
          router.push(search ? `/cafes?search=${encodeURIComponent(search)}` : "/cafes");
        }}
        className="hidden w-72 items-center gap-2 border border-line bg-paper-raised px-3 focus-within:border-ink focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rust md:flex lg:w-80"
      >
        <Search size={14} className="shrink-0 text-muted" aria-hidden />
        <label htmlFor="header-search" className="sr-only">
          Search cafés by name, or describe what you want
        </label>
        <input
          id="header-search"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={300}
          enterKeyHint="search"
          placeholder="Café name or what you feel like"
          className="w-full min-w-0 border-0 bg-transparent py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-0"
        />
      </form>
      <Link href="/cafes" aria-label="Search cafés" className="p-1 text-ink md:hidden focus-ring">
        <Search size={20} aria-hidden />
      </Link>
    </>
  );
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

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
        <Link href="/" className="font-display text-xl tracking-tight text-ink focus-ring">
          BrewMap
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {pathname !== "/cafes" && <HeaderSearch />}
          <Link href="/me/favorites" className="inline-flex items-center gap-1.5 nav-link max-sm:-m-2 max-sm:p-2">
            <Heart size={15} aria-hidden />
            <span className="max-sm:sr-only">Saved</span>
          </Link>
          <AccountLink />
        </div>
      </div>
    </header>
  );
}
