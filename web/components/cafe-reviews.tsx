"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RotateCw, Star } from "lucide-react";
import * as api from "@/lib/api";
import type { Review, ReviewInput } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const PAGE_SIZE = 10;
const TEXT_MIN = 10;
const TEXT_MAX = 1000;

const label = "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted";
const outlineButton =
  "inline-flex items-center gap-2 border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-wait disabled:opacity-60 focus-ring";
const textButton =
  "font-mono text-xs uppercase tracking-[0.1em] text-muted transition-colors hover:text-rust disabled:cursor-wait disabled:opacity-60 focus-ring";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-rust" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "fill-current" : "text-line"} aria-hidden />
      ))}
    </span>
  );
}

function errorText(error: unknown): string {
  if (!(error instanceof api.ApiError)) return "Something went wrong. Try again.";
  switch (error.status) {
    case 0:
      return "Can't reach BrewMap right now. Try again in a moment.";
    case 400:
      return `Pick a rating and write ${TEXT_MIN}–${TEXT_MAX} characters.`;
    case 403:
      return "You can only change your own review.";
    case 409:
      return "You already reviewed this café — edit that review instead.";
    default:
      return error.status >= 500
        ? "Something went wrong on our side. Try again in a moment."
        : error.message;
  }
}

function ReviewForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Review;
  submitLabel: string;
  onSubmit: (input: ReviewInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [drink, setDrink] = useState(initial?.drinkOrdered ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const length = text.trim().length;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1) {
      setError("Pick a rating from 1 to 5.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ rating, text: text.trim(), drinkOrdered: drink.trim() });
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <fieldset>
        <legend className={label}>Your rating</legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1 text-rust has-focus-visible:outline-2 has-focus-visible:outline-rust">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
              />
              <Star size={22} className={n <= rating ? "fill-current" : "text-muted"} aria-hidden />
              <span className="sr-only">
                {n} star{n === 1 ? "" : "s"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className={label}>Your review</span>
        <textarea
          name="text"
          required
          minLength={TEXT_MIN}
          maxLength={TEXT_MAX}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you order, how did it taste, would you go back?"
          className="mt-2 w-full resize-y border border-line bg-paper px-3 py-2 text-base leading-relaxed text-ink placeholder:text-muted focus:border-rust focus:outline-none"
        />
        <span className={`mt-1 block text-right font-mono text-[0.65rem] ${length > 0 && length < TEXT_MIN ? "text-rust" : "text-muted"}`}>
          {length}/{TEXT_MAX}
        </span>
      </label>

      <label className="block">
        <span className={label}>What you had (optional)</span>
        <input
          name="drinkOrdered"
          type="text"
          maxLength={100}
          value={drink}
          onChange={(e) => setDrink(e.target.value)}
          placeholder="e.g. Iced dirty, hojicha latte"
          className="mt-2 w-full border-0 border-b border-ink bg-transparent px-0 py-2 text-base text-ink placeholder:text-muted focus:border-rust focus:outline-none focus:ring-0"
        />
      </label>

      <p role="alert" aria-live="assertive" className="min-h-5 text-sm text-rust">
        {error}
      </p>

      <div className="flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={saving}
          className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-rust disabled:cursor-wait disabled:opacity-70 focus-ring"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className={textButton}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ReviewItem({ review, mine }: { review: Review; mine?: boolean }) {
  const edited = review.updatedAt !== review.createdAt;
  return (
    <li className="grid grid-cols-1 gap-3 border-b border-line py-6 md:grid-cols-12 md:gap-6">
      <div className="md:col-span-3">
        <p className="text-sm text-ink">
          {review.author.displayName}
          {mine && <span className="ml-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-rust">You</span>}
        </p>
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
          <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
          {edited && " · edited"}
        </p>
      </div>
      <div className="md:col-span-9">
        <Stars value={review.rating} />
        <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-ink-soft">{review.text}</p>
        {review.drinkOrdered && (
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
            Had: {review.drinkOrdered}
          </p>
        )}
      </div>
    </li>
  );
}

/** Community reviews for one café: list, plus write / edit / delete your own. */
export function CafeReviews({ slug, cafeName }: { slug: string; cafeName: string }) {
  const { status, user, endSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [list, setList] = useState<{
    items: Review[];
    total: number;
    /** Last page fetched. Paging follows this, not items.length, which de-duplication can shrink. */
    page: number;
    communityRating: number | null;
    communityReviewCount: number;
  } | null>(null);
  const [listError, setListError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Keyed by user so a review never shows under someone who logged in after its author.
  const [mineState, setMineState] = useState<{ userId: string; review: Review | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    try {
      const page = await api.getReviews(slug, { page: 1, limit: PAGE_SIZE });
      setList(page);
      setListError(false);
    } catch {
      setListError(true);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    api
      .getReviews(slug, { page: 1, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setList(page);
        setListError(false);
      })
      .catch(() => {
        if (!cancelled) setListError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const userId = user?.id ?? null;
  /** undefined while loading (or if it failed), null when the user has no review here. */
  const mine = userId && mineState?.userId === userId ? mineState.review : undefined;
  const setMine = (review: Review | null) => {
    if (userId) setMineState({ userId, review });
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .getMyReview(slug)
      .then((review) => {
        if (!cancelled) setMineState({ userId, review });
      })
      .catch(() => {
        // Not fatal: the form stays hidden and the list still shows.
      });
    return () => {
      cancelled = true;
    };
  }, [slug, userId]);

  // A 401 means the session ended elsewhere: show the visitor as logged out and send them to log in.
  function handleAuthError(error: unknown): never {
    if (error instanceof api.ApiError && error.status === 401) {
      endSession();
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
    throw error;
  }

  async function loadMore() {
    if (!list) return;
    setLoadingMore(true);
    try {
      const next = await api.getReviews(slug, {
        page: list.page + 1,
        limit: PAGE_SIZE,
      });
      setListError(false);
      setList({
        ...next,
        // A review added meanwhile can shift pages: never show one twice.
        items: [...list.items, ...next.items.filter((r) => !list.items.some((x) => x.id === r.id))],
      });
    } catch {
      setListError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function create(input: ReviewInput) {
    try {
      setMine(await api.createReview(slug, input));
    } catch (error) {
      handleAuthError(error);
    }
    await loadFirstPage();
  }

  async function update(input: ReviewInput) {
    if (!mine) return;
    try {
      setMine(await api.updateReview(mine.id, input));
    } catch (error) {
      handleAuthError(error);
    }
    setEditing(false);
    await loadFirstPage();
  }

  async function remove() {
    if (!mine) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteReview(mine.id);
      setMine(null);
      setConfirmDelete(false);
      await loadFirstPage();
    } catch (error) {
      try {
        handleAuthError(error);
      } catch {
        setDeleteError(errorText(error));
      }
    } finally {
      setDeleting(false);
    }
  }

  const ownCard = (() => {
    if (status === "loading") return null;
    if (status === "anonymous") {
      return (
        <p className="text-base text-ink-soft">
          Been to {cafeName}?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-rust hover:decoration-rust focus-ring"
          >
            Log in to write a review
          </Link>
          .
        </p>
      );
    }
    if (mine === undefined) return null;
    if (mine === null) {
      return (
        <div>
          <p className={label}>Write a review</p>
          <div className="mt-4">
            <ReviewForm submitLabel="Post review" onSubmit={create} />
          </div>
        </div>
      );
    }
    if (editing) {
      return (
        <div>
          <p className={label}>Edit your review</p>
          <div className="mt-4">
            <ReviewForm initial={mine} submitLabel="Save changes" onSubmit={update} onCancel={() => setEditing(false)} />
          </div>
        </div>
      );
    }
    return (
      <div>
        <p className={label}>Your review</p>
        <ul className="mt-2 border-t border-line">
          <ReviewItem review={mine} mine />
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <button type="button" onClick={() => setEditing(true)} className={outlineButton}>
            Edit
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-4">
              <span className="text-sm text-ink-soft">Delete your review?</span>
              <button type="button" onClick={remove} disabled={deleting} className={`${textButton} text-rust`}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className={textButton}>
                Keep it
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={textButton}>
              Delete
            </button>
          )}
        </div>
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-rust">
            {deleteError}
          </p>
        )}
      </div>
    );
  })();

  const others = list?.items.filter((r) => r.id !== mine?.id) ?? [];

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24 border-b border-line">
      <div className="page-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">From BrewMap regulars</p>
            <h2 id="reviews-heading" className="mt-4 font-display text-3xl tracking-tight text-ink">
              Community reviews
            </h2>
            <div className="mt-6" aria-live="polite">
              {list && list.communityRating !== null ? (
                <>
                  <p className="font-display text-5xl text-ink">{list.communityRating.toFixed(1)}</p>
                  <div className="mt-2">
                    <Stars value={Math.round(list.communityRating)} size={14} />
                  </div>
                  <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                    {list.communityReviewCount} review{list.communityReviewCount === 1 ? "" : "s"} on BrewMap
                  </p>
                </>
              ) : list ? (
                <p className="text-sm text-ink-soft">No BrewMap reviews yet — be the first.</p>
              ) : null}
            </div>
            <p className="mt-6 max-w-xs text-xs leading-relaxed text-muted">
              Separate from the Google rating above: only people who reviewed on BrewMap count here.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="border-t border-ink pt-6">{ownCard}</div>

            <div className="mt-10">
              {listError && !list ? (
                <div role="alert">
                  <p className="text-sm text-ink-soft">We couldn&apos;t load reviews right now.</p>
                  <button type="button" onClick={loadFirstPage} className={`mt-4 ${outlineButton}`}>
                    <RotateCw size={14} aria-hidden />
                    Try again
                  </button>
                </div>
              ) : !list ? (
                <p className={label} aria-live="polite">
                  Loading reviews…
                </p>
              ) : others.length > 0 ? (
                <>
                  <ul className="border-t border-line">
                    {others.map((review) => (
                      <ReviewItem key={review.id} review={review} />
                    ))}
                  </ul>
                  {list.page * PAGE_SIZE < list.total && (
                    <button type="button" onClick={loadMore} disabled={loadingMore} className={`mt-6 ${outlineButton}`}>
                      {loadingMore ? "Loading…" : "Show more reviews"}
                    </button>
                  )}
                  {listError && (
                    <p role="alert" className="mt-3 text-sm text-rust">
                      Couldn&apos;t load more reviews. Try again.
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
