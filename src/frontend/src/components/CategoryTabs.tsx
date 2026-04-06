interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  articleCounts?: Record<string, number>;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cricket", label: "Cricket" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "celebrity", label: "Celebrity" },
  { id: "politics", label: "Politics" },
  { id: "entertainment", label: "Entertainment" },
  { id: "local", label: "Local News" },
];

export { CATEGORIES };

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  articleCounts,
}: CategoryTabsProps) {
  return (
    <nav
      className="bg-card border-b border-border sticky top-0 z-30 shadow-xs"
      aria-label="News categories"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="flex items-center overflow-x-auto scrollbar-hide gap-1 py-1"
          role="tablist"
          aria-label="Category filter"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = articleCounts?.[cat.id];
            return (
              <button
                type="button"
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onCategoryChange(cat.id)}
                data-ocid={`category.${cat.id}.tab`}
                className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all rounded-sm ${
                  isActive
                    ? "text-news-red after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-news-red"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      isActive
                        ? "bg-news-red text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
