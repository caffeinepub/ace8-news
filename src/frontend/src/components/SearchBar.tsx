import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search news..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-ocid="search.search_input"
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-card border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder:text-muted-foreground text-foreground
            transition-all"
          aria-label="Search news articles"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
            data-ocid="search.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
