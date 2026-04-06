import { Clock, ExternalLink } from "lucide-react";
import type { Article } from "../backend.d";
import { formatTimeAgo } from "../hooks/useNews";

interface NewsCardProps {
  article: Article;
  index: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  cricket: "border-green-500",
  technology: "border-blue-500",
  business: "border-amber-500",
  celebrity: "border-purple-500",
  politics: "border-orange-600",
  entertainment: "border-pink-500",
  all: "border-gray-400",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  cricket: "bg-green-600",
  technology: "bg-blue-600",
  business: "bg-amber-600",
  celebrity: "bg-purple-600",
  politics: "bg-orange-700",
  entertainment: "bg-pink-600",
  all: "bg-gray-600",
};

export function NewsCard({ article, index }: NewsCardProps) {
  const timeAgo = formatTimeAgo(article.pubDate, article.pubTimestamp);
  const borderColor = CATEGORY_COLORS[article.category] ?? "border-news-red";
  const badgeColor = CATEGORY_BADGE_COLORS[article.category] ?? "bg-news-red";

  return (
    <article
      className={`bg-card rounded-lg overflow-hidden shadow-card dark:shadow-card-dark border border-border
        border-l-4 ${borderColor} flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group`}
      data-ocid={`news.item.${index}`}
    >
      {/* Card content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category badge */}
        <div className="mb-2">
          <span
            className={`text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badgeColor}`}
          >
            {article.category}
          </span>
        </div>

        <h2 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-3 mb-2 group-hover:text-news-red transition-colors">
          {article.title}
        </h2>

        {article.description && (
          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 flex-1 mb-3">
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {article.sourceName && (
              <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {article.sourceName}
              </span>
            )}
            <span className="text-muted-foreground text-xs flex items-center gap-0.5 shrink-0">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {timeAgo}
            </span>
          </div>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid={`news.read_more.${index}`}
            className="flex items-center gap-1 text-xs font-semibold text-news-red hover:underline shrink-0"
            aria-label={`Read more: ${article.title}`}
          >
            Read More
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function NewsCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="bg-card rounded-lg overflow-hidden border border-border border-l-4 border-l-muted shadow-card animate-pulse"
      data-ocid={`news.skeleton.${index}`}
      aria-hidden="true"
    >
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="space-y-1.5">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-5/6" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  );
}
