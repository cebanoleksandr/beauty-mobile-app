/** Display formatters for API values (prices are UAH, distances are meters). */

/** `500 ₴`, `1 200 ₴`. */
export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const rounded = Math.round(amount);
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} ₴`;
}

/** `365 m`, `1.2 km`, `14 km`. */
export function formatDistance(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters / 5) * 5} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** `4.9`, `5.0`. */
export function formatRating(rating: number | null | undefined): string | null {
  if (rating === null || rating === undefined || rating <= 0) return null;
  return rating.toFixed(1);
}

/** First word of a display name (`Roman Kozak` → `Roman`). */
export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}
