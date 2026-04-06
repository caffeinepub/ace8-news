import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { BreakingNewsTicker } from "./components/BreakingNewsTicker";
import { CalendarPicker } from "./components/CalendarPicker";
import { CategoryTabs } from "./components/CategoryTabs";
import { Header } from "./components/Header";
import { InstallBanner } from "./components/InstallBanner";
import { NewsGrid } from "./components/NewsGrid";
import { SearchBar } from "./components/SearchBar";
import {
  formatLastUpdated,
  useArticles,
  useBreakingNews,
} from "./hooks/useNews";
import { getArticlesFromCache } from "./utils/newsCache";

function App() {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem("ace8_lang") || "en";
  });
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("ace8_dark") === "true";
  });
  const [lastUpdated, setLastUpdated] = useState<bigint | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const queryClient = useQueryClient();
  // Track the previous language so we can detect actual changes
  const prevLangRef = useRef(language);

  // Apply dark mode to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ace8_dark", String(darkMode));
  }, [darkMode]);

  const handleDarkModeToggle = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      if (lang === prevLangRef.current) return; // no-op if same language
      prevLangRef.current = lang;
      // Clear ALL article caches for every category so stale content isn't shown
      queryClient.removeQueries({ queryKey: ["articles"] });
      queryClient.removeQueries({ queryKey: ["breaking"] });
      setLanguage(lang);
      localStorage.setItem("ace8_lang", lang);
      setSearchQuery("");
      setSelectedDate(null);
    },
    [queryClient],
  );

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat);
    setSearchQuery("");
    setSelectedDate(null);
  }, []);

  const {
    data: liveArticles = [],
    isLoading,
    isError,
    refetch,
  } = useArticles(category, language);

  const handleRefresh = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["articles", category, language] });
    queryClient.invalidateQueries({ queryKey: ["breaking"] });
    refetch();
    setLastUpdated(BigInt(Date.now()) * BigInt(1_000_000));
  }, [queryClient, category, language, refetch]);

  const { data: breakingNews = [], isLoading: breakingLoading } =
    useBreakingNews(language);

  // Update lastUpdated timestamp whenever new articles arrive
  useEffect(() => {
    if (liveArticles.length > 0) {
      setLastUpdated(BigInt(Date.now()) * BigInt(1_000_000));
    }
  }, [liveArticles]);

  // When a historical date is selected, try to load from cache
  const cachedArticles = selectedDate
    ? getArticlesFromCache(selectedDate, category, language)
    : null;
  const articles = cachedArticles ?? liveArticles;
  const isHistorical = selectedDate !== null && cachedArticles !== null;

  const lastUpdatedStr = formatLastUpdated(lastUpdated);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        darkMode={darkMode}
        onDarkModeToggle={handleDarkModeToggle}
        lastUpdated={
          lastUpdated && lastUpdated > BigInt(0) ? lastUpdatedStr : undefined
        }
      />

      {/* Breaking News Ticker */}
      <BreakingNewsTicker articles={breakingNews} isLoading={breakingLoading} />

      {/* Category Tabs (sticky) */}
      <CategoryTabs
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
        articleCounts={{ [category]: liveArticles.length }}
      />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4">
        {/* Search Bar */}
        <div className="-mx-4 sm:-mx-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Historical date banner */}
        {isHistorical && (
          <div
            className="mt-3 mb-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between"
            data-ocid="calendar.panel"
          >
            <span>
              Showing news from{" "}
              <strong>
                {selectedDate?.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs underline ml-3 shrink-0"
              data-ocid="calendar.close_button"
            >
              Back to live news
            </button>
          </div>
        )}

        {/* Results count / calendar row */}
        <div className="flex items-center justify-between my-3">
          <div className="text-sm text-muted-foreground">
            {searchQuery &&
              (isLoading
                ? "Searching..."
                : `${
                    articles.filter(
                      (a) =>
                        a.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        a.description
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    ).length
                  } results for "${searchQuery}"`)}
            {!searchQuery && !isLoading && articles.length > 0 && (
              <span>{articles.length} articles</span>
            )}
            {!searchQuery && isLoading && articles.length > 0 && (
              <span className="animate-pulse">
                {articles.length} articles (loading more...)
              </span>
            )}
          </div>
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* News Grid */}
        <NewsGrid
          articles={articles}
          isLoading={isLoading && articles.length === 0 && !isHistorical}
          isError={isError && articles.length === 0 && !isHistorical}
          searchQuery={searchQuery}
          onRefresh={
            isError && articles.length === 0 ? () => refetch() : handleRefresh
          }
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-bold text-news-red text-base">
                ACE8 NEWS
              </span>
              <span>·</span>
              <span>Your trusted source for latest news</span>
            </div>
            <p>
              © {currentYear}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* PWA Install Banner */}
      <InstallBanner />
    </div>
  );
}

export default App;
