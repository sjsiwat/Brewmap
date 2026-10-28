"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Cafe } from "@/lib/cafes";
import { useFavorites } from "@/lib/favorites";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

/** Save / unsave a café. Logged out: sends you to /login and back here afterwards. */
export function FavoriteButton({
  cafe,
  showLabel = false,
  className = "",
}: {
  cafe: Cafe;
  showLabel?: boolean;
  className?: string;
}) {
  const { status } = useAuth();
  const favorites = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const { t: dict, href } = useI18n();
  const t = dict.favorites;
  const [failed, setFailed] = useState(false);
  const saved = favorites.isFavorite(cafe.slug);

  async function onClick() {
    if (status !== "authenticated") {
      router.push(href(`/login?next=${encodeURIComponent(pathname)}`));
      return;
    }
    setFailed(false);
    try {
      await favorites.toggle(cafe);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(href(`/login?next=${encodeURIComponent(pathname)}`));
        return;
      }
      setFailed(true);
    }
  }

  const label = format(saved ? t.removeLabel : t.saveLabel, { name: cafe.name });

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={status === "authenticated" ? saved : undefined}
      aria-label={showLabel ? undefined : label}
      title={failed ? t.failed : label}
      className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors focus-ring ${
        saved ? "text-rust" : "text-muted hover:text-rust"
      } ${className}`}
    >
      <Heart size={18} className={saved ? "fill-current" : ""} aria-hidden />
      {showLabel && (
        <span>{failed ? t.tryAgain : saved ? t.saved : t.save}</span>
      )}
    </button>
  );
}
