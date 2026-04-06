import { Newspaper, RefreshCw } from "lucide-react";
import type { Article } from "../backend.d";
import { NewsCard, NewsCardSkeleton } from "./NewsCard";

interface NewsGridProps {
  articles: Article[];
  isLoading: boolean;
  isError?: boolean;
  searchQuery: string;
  onRefresh?: () => void;
}

export function NewsGrid({
  articles,
  isLoading,
  isError,
  searchQuery,
  onRefresh,
}: NewsGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        data-ocid="news.loading_state"
        aria-label="Loading news articles"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable id
          <NewsCardSkeleton key={i} index={i + 1} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        data-ocid="news.error_state"
      >
        <Newspaper
          className="w-16 h-16 text-muted-foreground mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Unable to load news
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          There was an error fetching the latest news. Please try again.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            data-ocid="news.refresh.button"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : articles;

  if (filtered.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        data-ocid="news.empty_state"
      >
        <Newspaper
          className="w-16 h-16 text-muted-foreground mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {searchQuery ? "No results found" : "Loading fresh news..."}
        </h3>
        <p className="text-muted-foreground text-sm">
          {searchQuery
            ? `No news articles match "${searchQuery}". Try a different search term.`
            : "Fetching the latest headlines. This usually takes a few seconds."}
        </p>
        {!searchQuery && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            data-ocid="news.refresh.button"
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      data-ocid="news.list"
      aria-label={`${filtered.length} news articles`}
    >
      {filtered.map((article, i) => (
        <NewsCard
          key={article.id || `${article.title}-${i}`}
          article={article}
          index={i + 1}
        />
      ))}
    </div>
  );
}
