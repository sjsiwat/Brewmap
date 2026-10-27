export class GoogleReviewDto {
  rating: number;
  text: string;
  translatedText: string | null;
  language: string | null;
  /** ISO date, or null when unknown. */
  publishedAt: string | null;
}

export class GoogleReviewsResponseDto {
  items: GoogleReviewDto[];
  total: number;
}
