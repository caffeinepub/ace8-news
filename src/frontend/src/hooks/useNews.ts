import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Article } from "../backend.d";
import { saveArticlesToCache } from "../utils/newsCache";
import { fetchArticles, fetchBreakingNews } from "../utils/rssFetcher";

// Progressive articles hook: shows partial results as they load
export function useArticles(category: string, language: string) {
  const [progressiveArticles, setProgressiveArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const queryClient = useQueryClient();
  // Use a ref that tracks the EXACT current fetch key to cancel stale fetches
  const fetchKeyRef = useRef("");
  const partialReceivedRef = useRef(false);

  const doFetch = useCallback(
    async (cat: string, lang: string) => {
      const fetchKey = `${cat}_${lang}_${Date.now()}`;
      fetchKeyRef.current = fetchKey;
      partialReceivedRef.current = false;

      // Check React Query cache first for instant display
      const cached = queryClient.getQueryData<Article[]>([
        "articles",
        cat,
        lang,
      ]);
      if (cached && cached.length > 0) {
        setProgressiveArticles(cached);
        setIsLoading(false);
        setIsError(false);
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setProgressiveArticles([]);

      try {
        const articles = await fetchArticles(cat, lang, (partial) => {
          // Only update state if this is still the current fetch
          if (fetchKeyRef.current === fetchKey) {
            partialReceivedRef.current = true;
            setProgressiveArticles(partial);
            setIsLoading(true); // still loading more
          }
        });

        if (fetchKeyRef.current === fetchKey) {
          setProgressiveArticles(articles);
          setIsLoading(false);
          setIsError(false);
          queryClient.setQueryData(["articles", cat, lang], articles);
          saveArticlesToCache(articles, cat, lang);
        }
      } catch {
        if (fetchKeyRef.current === fetchKey) {
          setIsLoading(false);
          if (!partialReceivedRef.current) {
            setIsError(true);
          }
        }
      }
    },
    [queryClient],
  );

  const refetch = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["articles", category, language] });
    doFetch(category, language);
  }, [category, language, queryClient, doFetch]);

  // Re-run whenever category OR language changes
  useEffect(() => {
    doFetch(category, language);

    const interval = setInterval(
      () => {
        queryClient.removeQueries({
          queryKey: ["articles", category, language],
        });
        doFetch(category, language);
      },
      30 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [doFetch, category, language, queryClient]);

  return {
    data: progressiveArticles,
    isLoading,
    isError,
    refetch,
  };
}

export function useBreakingNews(language: string) {
  return useQuery<Article[]>({
    queryKey: ["breaking", language],
    queryFn: () => fetchBreakingNews(language),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 2,
  });
}

export function useLastUpdated() {
  return { data: BigInt(Date.now()) * BigInt(1_000_000) };
}

export function formatTimeAgo(pubDate: string, pubTimestamp?: bigint): string {
  try {
    let date: Date;
    if (pubTimestamp && pubTimestamp > BigInt(0)) {
      date = new Date(Number(pubTimestamp / BigInt(1_000_000)));
    } else {
      date = new Date(pubDate);
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return pubDate || "";
  }
}

export function formatLastUpdated(ts: bigint | undefined): string {
  if (!ts || ts === BigInt(0)) return "Not yet updated";
  try {
    const date = new Date(Number(ts / BigInt(1_000_000)));
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}
