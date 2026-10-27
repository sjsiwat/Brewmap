"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Cafe } from "@/lib/cafes";
import { useFavorites } from "@/lib/favorites";

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
  const [failed, setFailed] = useState(false);
  const saved = favorites.isFavorite(cafe.slug);

  async function onClick() {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setFailed(false);
    try {
      await favorites.toggle(cafe);
    } catch {
      setFailed(true);
    }
  }

  const label = saved ? `Remove ${cafe.name} from favorites` : `Save ${cafe.name} to favorites`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={status === "authenticated" ? saved : undefined}
      aria-label={showLabel ? undefined : label}
      title={failed ? "Couldn't update favorites - try again" : label}
      className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust ${
        saved ? "text-rust" : "text-muted hover:text-rust"
      } ${className}`}
    >
      <Heart size={18} className={saved ? "fill-current" : ""} aria-hidden />
      {showLabel && (
        <span>{failed ? "Try again" : saved ? "Saved" : "Save"}</span>
      )}
    </button>
  );
}
