/**
 * Format a number with commas (e.g., 1234 -> "1,234")
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Format a percentage (e.g., 0.756 -> "75.6%")
 */
export function formatPercent(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/**
 * Format a date as YYYY/MM/DD
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generate a short ID for local-only entities
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
