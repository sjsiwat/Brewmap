import type { Cafe, DrinkType } from "@/lib/cafes";

// Inlined at build time (NEXT_PUBLIC_*), so the same value is used on the server and in the browser.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

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
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the BrewMap API");
  }
  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response));
  }
  return (await response.json()) as T;
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
