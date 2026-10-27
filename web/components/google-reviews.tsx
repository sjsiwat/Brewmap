import { Stars } from "@/components/stars";
import type { GoogleReview } from "@/lib/api";
import type { Cafe } from "@/lib/cafes";

const dateFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

const LANGUAGE_NAMES: Record<string, string> = { th: "Thai", ko: "Korean", ja: "Japanese", zh: "Chinese" };

/** Long reviews start folded; <details> needs no JavaScript and is keyboard-friendly. */
const FOLD_AT = 420;

function ReviewText({ text }: { text: string }) {
  if (text.length <= FOLD_AT) {
    return <p className="whitespace-pre-line text-base leading-relaxed text-ink-soft">{text}</p>;
  }
  const cut = text.lastIndexOf(" ", FOLD_AT);
  const preview = `${text.slice(0, cut > 200 ? cut : FOLD_AT).trimEnd()}…`;
  return (
    <details className="group">
      <summary className="focus-ring cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <p className="whitespace-pre-line text-base leading-relaxed text-ink-soft group-open:hidden">{preview}</p>
        <span className="mt-2 inline-block font-mono text-[0.65rem] uppercase tracking-[0.1em] text-rust group-open:hidden">
          Read the full review
        </span>
      </summary>
      <p className="whitespace-pre-line text-base leading-relaxed text-ink-soft">{text}</p>
    </details>
  );
}

/**
 * What Google Maps reviewers wrote about the café, from the data we imported.
 * Reviewer names are left out on purpose, and owner replies are never shown.
 */
export function GoogleReviews({ cafe, reviews }: { cafe: Cafe; reviews: GoogleReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="google-reviews-heading" className="border-b border-line">
      <div className="page-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">From Google Maps</p>
            <h2 id="google-reviews-heading" className="mt-4 font-display text-3xl tracking-tight text-ink">
              Google reviews
            </h2>
            <p className="mt-6 font-display text-5xl text-ink">{cafe.rating.toFixed(1)}</p>
            <div className="mt-2">
              <Stars value={Math.round(cafe.rating)} size={14} />
            </div>
            <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
              {cafe.reviewCount.toLocaleString("en-GB")} reviews on Google
            </p>
            <p className="mt-6 max-w-xs text-xs leading-relaxed text-muted">
              {reviews.length} recent {reviews.length === 1 ? "review" : "reviews"} from Google Maps, shown without
              reviewer names. Owner replies aren&apos;t included.
            </p>
          </div>

          <ul className="border-t border-ink lg:col-span-8">
            {reviews.map((review, i) => {
              const language = review.language && review.language !== "en" ? review.language : null;
              return (
                <li
                  key={`${review.publishedAt ?? "undated"}-${i}`}
                  className="grid grid-cols-1 gap-3 border-b border-line py-6 md:grid-cols-12 md:gap-6"
                >
                  <div className="md:col-span-3">
                    <p className="text-sm text-ink">Google reviewer</p>
                    <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                      {review.publishedAt ? (
                        <time dateTime={review.publishedAt}>{dateFormat.format(new Date(review.publishedAt))}</time>
                      ) : (
                        "Date unknown"
                      )}
                      {language && ` · ${LANGUAGE_NAMES[language] ?? language}`}
                    </p>
                  </div>
                  <div className="md:col-span-9">
                    <Stars value={review.rating} />
                    <div className="mt-2" lang={review.language ?? undefined}>
                      <ReviewText text={review.text} />
                    </div>
                    {review.translatedText && (
                      <details className="mt-3">
                        <summary className="focus-ring cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.1em] text-rust">
                          English translation (by Google)
                        </summary>
                        <p lang="en" className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                          {review.translatedText}
                        </p>
                      </details>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
