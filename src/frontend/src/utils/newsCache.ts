import type { Article } from "../backend.d";

const CACHE_KEY_PREFIX = "ace8_news_cache_";
const MAX_AGE_DAYS = 30;

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function pruneOldEntries(): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(CACHE_KEY_PREFIX),
  );
  for (const key of keys) {
    const dateStr = key.replace(CACHE_KEY_PREFIX, "").split("_")[0];
    if (new Date(dateStr) < cutoff) {
      localStorage.removeItem(key);
    }
  }
}

export function saveArticlesToCache(
  articles: Article[],
  category: string,
  language: string,
): void {
  pruneOldEntries();
  const today = dateKey(new Date());
  const storageKey = `${CACHE_KEY_PREFIX}${today}_${category}_${language}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(articles));
  } catch {
    // localStorage might be full, ignore
  }
}

export function getArticlesFromCache(
  date: Date,
  category: string,
  language: string,
): Article[] | null {
  const key = `${CACHE_KEY_PREFIX}${dateKey(date)}_${category}_${language}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Article[];
  } catch {
    return null;
  }
}

export function getAvailableDates(): Date[] {
  pruneOldEntries();
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(CACHE_KEY_PREFIX),
  );
  const dateStrings = new Set<string>();
  for (const key of keys) {
    const parts = key.replace(CACHE_KEY_PREFIX, "").split("_");
    if (parts[0]) dateStrings.add(parts[0]);
  }
  return Array.from(dateStrings).map((s) => new Date(s));
}
