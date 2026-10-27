import { Star } from "lucide-react";

/** 1-5 filled stars with an accessible "N out of 5" label. */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-rust" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "fill-current" : "text-line"} aria-hidden />
      ))}
    </span>
  );
}
