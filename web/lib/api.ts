import type { Cafe, DrinkType } from "@/lib/cafes";

// The browser goes through the /api rewrite in next.config.ts (same origin, so the
// httpOnly auth cookie is sent); server components call the API directly.
export const API_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:4000/api").replace(/\/$/, "")
    : "/api";

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the API couldn't be reached at all. */
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type CafeSort = "rating" | "distance" | "reviews" | "price";

/** Mirrors QueryCafesDto in server/src/cafes/dto/query-cafes.dto.ts. */
export interface CafeQuery {
  minPrice?: number;
  maxPrice?: number;
  drinkType?: DrinkType;
  parking?: boolean;
  petFriendly?: boolean;
  tag?: string;
  area?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: CafeSort;
  page?: number;
  limit?: number;
}

/** A café as returned by the list endpoint: `distanceKm` is present when lat/lng were sent. */
export type CafeResult = Cafe & { distanceKm?: number };

export interface CafePage {
  items: CafeResult[];
  total: number;
  page: number;
  limit: number;
}

type QueryValue = string | number | boolean | null | undefined;

/** Builds `?a=1&b=2`, skipping unset and empty values so the API never sees `?maxPrice=`. */
export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (body.message) return body.message;
  } catch {
    // Non-JSON error body - fall through to the status text.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the BrewMap API");
  }
  if (!response.ok) {
    // The NestJS API always answers errors with JSON. A 5xx without it comes from
    // the /api rewrite proxy failing to reach the API, so report it as unreachable.
    const fromApi = response.headers.get("content-type")?.includes("application/json");
    if (response.status >= 500 && !fromApi) {
      throw new ApiError(0, "Can't reach the BrewMap API");
    }
    throw new ApiError(response.status, await errorMessage(response));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function sendJson(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function getCafes(query: CafeQuery, init?: RequestInit): Promise<CafePage> {
  return apiFetch<CafePage>(`/cafes${buildQuery({ ...query })}`, init);
}

/** Returns null when the café doesn't exist; throws ApiError for anything else. */
export async function getCafe(slug: string, init?: RequestInit): Promise<Cafe | null> {
  try {
    return await apiFetch<Cafe>(`/cafes/${encodeURIComponent(slug)}`, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

const MAX_PAGE_SIZE = 50;

export async function getAllCafeSlugs(init?: RequestInit): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; ; page++) {
    const result = await getCafes({ page, limit: MAX_PAGE_SIZE }, init);
    slugs.push(...result.items.map((cafe) => cafe.slug));
    if (slugs.length >= result.total || result.items.length === 0) return slugs;
  }
}

/** Mirrors UserResponseDto in server/src/users/user-response.dto.ts. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "owner" | "admin";
}

export function register(body: {
  email: string;
  password: string;
  displayName: string;
}): Promise<User> {
  return apiFetch<User>("/auth/register", sendJson("POST", body));
}

/** Sets the httpOnly `access_token` cookie on success. */
export function login(body: { email: string; password: string }): Promise<User> {
  return apiFetch<User>("/auth/login", sendJson("POST", body));
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

/** The logged-in user, or null when there is no valid session. */
export async function getMe(init?: RequestInit): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me", { cache: "no-store", ...init });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function getFavorites(init?: RequestInit): Promise<Cafe[]> {
  return apiFetch<Cafe[]>("/me/favorites", { cache: "no-store", ...init });
}

export function addFavorite(slug: string): Promise<void> {
  return apiFetch<void>(`/me/favorites/${encodeURIComponent(slug)}`, { method: "PUT" });
}

export function removeFavorite(slug: string): Promise<void> {
  return apiFetch<void>(`/me/favorites/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

/** Mirrors ReviewResponseDto in server/src/reviews/dto/review.dto.ts. */
export interface Review {
  id: string;
  rating: number;
  text: string;
  drinkOrdered?: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; displayName: string };
}

export interface ReviewPage {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  communityRating: number | null;
  communityReviewCount: number;
}

export interface ReviewInput {
  rating: number;
  text: string;
  /** "" clears it when editing. */
  drinkOrdered?: string;
}

const reviewsPath = (slug: string) => `/cafes/${encodeURIComponent(slug)}/reviews`;

export function getReviews(
  slug: string,
  query: { page?: number; limit?: number },
  init?: RequestInit,
): Promise<ReviewPage> {
  return apiFetch<ReviewPage>(`${reviewsPath(slug)}${buildQuery(query)}`, {
    cache: "no-store",
    ...init,
  });
}

/** The logged-in user's review of this café, or null. */
export async function getMyReview(slug: string, init?: RequestInit): Promise<Review | null> {
  const { review } = await apiFetch<{ review: Review | null }>(`${reviewsPath(slug)}/mine`, {
    cache: "no-store",
    ...init,
  });
  return review;
}

export function createReview(slug: string, input: ReviewInput): Promise<Review> {
  return apiFetch<Review>(reviewsPath(slug), sendJson("POST", input));
}

export function updateReview(id: string, input: ReviewInput): Promise<Review> {
  return apiFetch<Review>(`/reviews/${encodeURIComponent(id)}`, sendJson("PATCH", input));
}

export function deleteReview(id: string): Promise<void> {
  return apiFetch<void>(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
}
