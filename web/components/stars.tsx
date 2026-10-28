import { Star } from "lucide-react";
import { format } from "@/lib/i18n/config";

/** 1-5 filled stars, read out as `outOf5` from the dictionary's units ("4 out of 5"). */
export function Stars({ value, outOf5, size = 12 }: { value: number; outOf5: string; size?: number }) {
  return (
    <span role="img" className="inline-flex items-center gap-0.5 text-rust" aria-label={format(outOf5, { n: value })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "fill-current" : "text-line"} aria-hidden />
      ))}
    </span>
  );
}
