import type { Article } from "../backend.d";

interface BreakingNewsTickerProps {
  articles: Article[];
  isLoading?: boolean;
}

const FALLBACK_MESSAGES = [
  "Welcome to ACE8 NEWS - Your trusted source for the latest news",
  "Breaking news from across India and around the world",
  "Stay informed with ACE8 NEWS - Updated every hour",
];

export function BreakingNewsTicker({
  articles,
  isLoading,
}: BreakingNewsTickerProps) {
  const headlines =
    articles.length > 0
      ? articles.map((a) => a.title)
      : isLoading
        ? ["Loading latest breaking news..."]
        : FALLBACK_MESSAGES;

  const tickerText = headlines.join("  ●  ");

  return (
    <div
      className="bg-news-red-dark text-white relative overflow-hidden"
      role="marquee"
      aria-label="Breaking news ticker"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-2 bg-red-900 px-3 py-2 z-10">
          <span
            className="w-2 h-2 rounded-full bg-white animate-blink"
            aria-hidden="true"
          />
          <span className="text-xs font-bold tracking-widest uppercase whitespace-nowrap">
            Breaking
          </span>
        </div>

        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden relative h-9 flex items-center">
          <div className="flex whitespace-nowrap animate-marquee text-sm font-medium">
            <span className="px-4">{tickerText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
