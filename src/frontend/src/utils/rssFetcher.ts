import type { Article } from "../backend.d";

const LANG_CONFIG: Record<string, { hl: string; gl: string; ceid: string }> = {
  en: { hl: "en-IN", gl: "IN", ceid: "IN:en" },
  hi: { hl: "hi", gl: "IN", ceid: "IN:hi" },
  ta: { hl: "ta", gl: "IN", ceid: "IN:ta" },
  te: { hl: "te", gl: "IN", ceid: "IN:te" },
  bn: { hl: "bn", gl: "IN", ceid: "IN:bn" },
  mr: { hl: "mr", gl: "IN", ceid: "IN:mr" },
  gu: { hl: "gu", gl: "IN", ceid: "IN:gu" },
  kn: { hl: "kn", gl: "IN", ceid: "IN:kn" },
  ml: { hl: "ml", gl: "IN", ceid: "IN:ml" },
  pa: { hl: "pa", gl: "IN", ceid: "IN:pa" },
};

const DEFAULT_LANG = LANG_CONFIG.en;

// Multiple queries per category for maximum coverage
const CATEGORY_TOPICS: Record<string, string[]> = {
  all: [],
  cricket: [
    "cricket India",
    "IPL 2024 cricket",
    "cricket score today",
    "test match cricket India",
    "India cricket team news",
    "cricket T20 India",
    "BCCI cricket news",
    "ODI cricket India",
    "IPL auction cricket",
    "cricket world cup",
  ],
  technology: [
    "technology news India",
    "AI artificial intelligence India",
    "tech startup India 2024",
    "mobile phone launch India",
    "internet broadband India",
    "software India IT",
    "gadgets India review",
    "cybersecurity India",
    "5G India telecom",
    "electric vehicle EV India technology",
  ],
  business: [
    "business India economy news",
    "stock market India BSE NSE",
    "Sensex Nifty today",
    "RBI economy India news",
    "startup funding India",
    "GDP India growth",
    "banking finance India",
    "trade export India",
    "rupee dollar exchange",
    "India economy budget",
  ],
  celebrity: [
    "bollywood celebrity news",
    "bollywood actor actress",
    "Indian celebrity gossip",
    "film star India news",
    "bollywood marriage divorce",
    "celebrity award India",
    "bollywood box office",
    "Bollywood controversies",
    "celebrity interview India",
    "film industry India news",
  ],
  politics: [
    "India politics government news",
    "BJP Congress India",
    "India election 2024",
    "parliament India session",
    "Modi government policy",
    "state election India",
    "Indian politician news",
    "India policy governance",
    "Lok Sabha Rajya Sabha",
    "India state politics news",
  ],
  entertainment: [
    "entertainment India movies",
    "OTT streaming India",
    "bollywood film release 2024",
    "web series India new",
    "Netflix India new show",
    "Amazon Prime India",
    "Bollywood box office collection",
    "Hindi film review",
    "South Indian movies",
    "Telugu Tamil film news",
  ],
  local: [
    "Delhi local news today",
    "Mumbai Maharashtra news",
    "Bangalore Karnataka news",
    "Chennai Tamil Nadu news",
    "Kolkata West Bengal news",
    "Hyderabad Telangana news",
    "Ahmedabad Gujarat news",
    "Pune Maharashtra news",
    "Lucknow Uttar Pradesh news",
    "Jaipur Rajasthan news",
    "Bhopal Madhya Pradesh news",
    "Patna Bihar news",
    "Chandigarh Punjab Haryana news",
    "Bhubaneswar Odisha news",
    "Guwahati Assam Northeast India news",
    "Kerala local news",
    "Goa news today",
    "Jharkhand Chhattisgarh news",
    "Uttarakhand Himachal Pradesh news",
    "India state news district",
  ],
};

// Supplementary direct RSS feeds per category
const SUPPLEMENTARY_FEEDS: Record<string, string[]> = {
  cricket: [
    "https://www.cricbuzz.com/cricket-news/rss",
    "https://sports.ndtv.com/cricket/rss",
    "https://timesofindia.indiatimes.com/rss/sports/cricket",
  ],
  technology: [
    "https://feeds.feedburner.com/ndtvtech",
    "https://timesofindia.indiatimes.com/rss/tech/techreviews",
  ],
  business: [
    "https://economictimes.indiatimes.com/markets/rss.cms",
    "https://www.business-standard.com/rss/latest.rss",
  ],
  politics: [
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "https://www.ndtv.com/india/rss",
  ],
  entertainment: [
    "https://timesofindia.indiatimes.com/rss/entertainment/bollywoodnews.cms",
  ],
  celebrity: [
    "https://timesofindia.indiatimes.com/rss/entertainment/celebs.cms",
  ],
  local: [
    "https://www.ndtv.com/india/rss",
    "https://timesofindia.indiatimes.com/rss/1221689",
  ],
  all: [],
};

function buildGoogleNewsUrl(
  topic: string | null,
  hl: string,
  gl: string,
  ceid: string,
): string {
  if (!topic)
    return `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

// ─── rss2json (primary) ───────────────────────────────────────────────────────
interface R2JItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  enclosure?: { link?: string; url?: string };
  thumbnail?: string;
  author?: string;
}

async function fetchViaRss2Json(rssUrl: string): Promise<R2JItem[]> {
  // Use a shorter timeout (5s) for faster failure + fallback
  const u = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(u, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`r2j ${res.status}`);
  const d = (await res.json()) as { status: string; items?: R2JItem[] };
  if (d.status !== "ok" || !d.items?.length) throw new Error("r2j empty");
  return d.items;
}

// ─── CORS proxy fallback (raw XML) ────────────────────────────────────────────
const PROXIES: Array<(u: string) => string> = [
  (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

async function fetchXml(rssUrl: string): Promise<string> {
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const res = await fetch(PROXIES[i](rssUrl), {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      if (i === 0) {
        const d = (await res.json()) as { contents?: string };
        if (d.contents?.includes("<item>")) return d.contents;
        continue;
      }
      const txt = await res.text();
      if (txt.includes("<item>")) return txt;
    } catch {
      /* try next */
    }
  }
  throw new Error("All proxies failed");
}

// ─── XML helpers ──────────────────────────────────────────────────────────────
function clean(s: string): string {
  const m = s.trim().match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return (m ? m[1] : s)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(xml: string, t: string): string {
  const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\/${t}>`, "i"));
  return m ? m[1] : "";
}

function extractImgFromHtml(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? "";
}

function img(xml: string): string {
  for (const re of [
    /<media:content[^>]+url="([^"]+)"/,
    /<media:thumbnail[^>]+url="([^"]+)"/,
    /<enclosure[^>]+url="([^"]+)"/,
    /<img[^>]+src="([^"]+)"/,
  ]) {
    const m = xml.match(re);
    if (m?.[1]) return m[1];
  }
  const descMatch = xml.match(/<description>([\s\S]*?)<\/description>/i);
  if (descMatch) {
    const imgFromDesc = extractImgFromHtml(descMatch[1]);
    if (imgFromDesc) return imgFromDesc;
  }
  return "";
}

function src(xml: string): string {
  const m = xml.match(/<source[^>]*>([^<]*)<\/source>/);
  if (m) return clean(m[1]);
  const m2 = xml.match(/sourceName="([^"]+)"/);
  return m2 ? m2[1] : "Google News";
}

function parseXml(
  xml: string,
  category: string,
  language: string,
  max = 30,
): Article[] {
  const parts = xml.split("<item>").slice(1, max + 1);
  return parts.flatMap((itemXml, i) => {
    const title = clean(tag(itemXml, "title"));
    if (!title) return [];
    const link = clean(tag(itemXml, "link")) || clean(tag(itemXml, "guid"));
    return [
      {
        id: `${language}-${category}-${i}-${Date.now()}`,
        title,
        description: clean(tag(itemXml, "description")).slice(0, 300) || title,
        link,
        pubDate: clean(tag(itemXml, "pubDate")),
        pubTimestamp: BigInt(0),
        sourceName: src(itemXml),
        imageUrl: img(itemXml),
        category,
        language,
      } satisfies Article,
    ];
  });
}

// ─── Convert rss2json items ───────────────────────────────────────────────────
function fromR2J(
  items: R2JItem[],
  category: string,
  language: string,
): Article[] {
  return items.map((item, i) => {
    let title = item.title || "";
    let sourceName = item.author || "Google News";
    const dash = title.lastIndexOf(" - ");
    if (dash > 0) {
      sourceName = title.slice(dash + 3).trim();
      title = title.slice(0, dash).trim();
    }
    return {
      id: `${language}-${category}-${i}-${Date.now()}`,
      title,
      description: clean(item.description || "").slice(0, 300) || title,
      link: item.link || "",
      pubDate: item.pubDate || "",
      pubTimestamp: BigInt(0),
      sourceName,
      imageUrl:
        item.thumbnail ||
        item.enclosure?.link ||
        item.enclosure?.url ||
        extractImgFromHtml(item.description || "") ||
        "",
      category,
      language,
    } satisfies Article;
  });
}

// ─── Race between rss2json and first CORS proxy ───────────────────────────────
// Whichever returns first wins (fastest strategy)
async function fetchSingleFeedFast(
  rssUrl: string,
  category: string,
  language: string,
): Promise<Article[]> {
  // Build a race: rss2json vs allorigins simultaneously
  const r2jPromise = fetchViaRss2Json(rssUrl)
    .then((items) => fromR2J(items, category, language))
    .catch(() => null);

  // Also try allorigins in parallel from the start
  const proxyPromise = (async () => {
    try {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) return null;
      const d = (await res.json()) as { contents?: string };
      if (!d.contents?.includes("<item>")) return null;
      return parseXml(d.contents, category, language, 30);
    } catch {
      return null;
    }
  })();

  // Race: take whichever resolves first with articles
  return new Promise<Article[]>((resolve) => {
    let settled = 0;
    const tryResolve = (result: Article[] | null) => {
      settled++;
      if (result && result.length > 0) {
        resolve(result);
      } else if (settled === 2) {
        // both failed
        resolve([]);
      }
    };
    r2jPromise.then(tryResolve);
    proxyPromise.then(tryResolve);
  });
}

// De-duplicate articles by title similarity
function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.slice(0, 60).toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Progressive fetcher: returns first batch quickly, then more ──────────────
export async function fetchArticles(
  category: string,
  language: string,
  onProgress?: (articles: Article[]) => void,
): Promise<Article[]> {
  const lang = LANG_CONFIG[language] ?? DEFAULT_LANG;
  const topics = CATEGORY_TOPICS[category] ?? [];
  const supplementary = SUPPLEMENTARY_FEEDS[category] ?? [];

  let allArticles: Article[] = [];

  // For "all" category, fetch general top-news feed first (fast)
  if (category === "all") {
    const topNewsUrl = buildGoogleNewsUrl(null, lang.hl, lang.gl, lang.ceid);
    const topNews = await fetchSingleFeedFast(topNewsUrl, "all", language);
    allArticles.push(...topNews);
    if (onProgress && topNews.length > 0) {
      onProgress(deduplicateArticles([...allArticles]));
    }
  }

  if (topics.length > 0) {
    // First batch: first 3 topics in parallel (very fast first-paint)
    const firstBatch = topics
      .slice(0, 3)
      .map((topic) => buildGoogleNewsUrl(topic, lang.hl, lang.gl, lang.ceid));
    // Rest + supplementary
    const restBatch = topics
      .slice(3)
      .map((topic) => buildGoogleNewsUrl(topic, lang.hl, lang.gl, lang.ceid));
    const allRest = [...restBatch, ...supplementary];

    // Fetch first batch in parallel (race strategy per feed)
    const firstResults = await Promise.allSettled(
      firstBatch.map((url) => fetchSingleFeedFast(url, category, language)),
    );
    for (const result of firstResults) {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allArticles.push(...result.value);
      }
    }

    // Report progress after first batch
    if (onProgress && allArticles.length > 0) {
      onProgress(deduplicateArticles([...allArticles]));
    }

    // Fetch ALL remaining in parallel simultaneously (don't wait for each)
    const restResults = await Promise.allSettled(
      allRest.map((url) => fetchSingleFeedFast(url, category, language)),
    );
    for (const result of restResults) {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allArticles.push(...result.value);
      }
    }
  }

  // Deduplicate and cap at 150
  allArticles = deduplicateArticles(allArticles);

  if (allArticles.length > 0) return allArticles.slice(0, 150);

  // English fallback
  try {
    const fallback = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en";
    const items = await fetchViaRss2Json(fallback);
    const articles = fromR2J(items, category, language);
    if (articles.length) return articles;
  } catch {
    /* give up */
  }

  throw new Error("All news strategies failed");
}

export async function fetchBreakingNews(language: string): Promise<Article[]> {
  const lang = LANG_CONFIG[language] ?? DEFAULT_LANG;
  const rssUrl = buildGoogleNewsUrl(null, lang.hl, lang.gl, lang.ceid);

  // Race rss2json vs allorigins for breaking news too
  const r2jPromise = fetchViaRss2Json(rssUrl)
    .then((items) => fromR2J(items, "all", language).slice(0, 5))
    .catch(() => null);

  const proxyPromise = (async () => {
    try {
      const xml = await fetchXml(rssUrl);
      return parseXml(xml, "all", language, 10).slice(0, 5);
    } catch {
      return null;
    }
  })();

  const result = await Promise.race([
    r2jPromise.then((r) => r ?? []),
    proxyPromise.then((r) => r ?? []),
  ]);
  return result;
}

export function getSourceFavicon(link: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=32`;
  } catch {
    return "";
  }
}

export { LANG_CONFIG, CATEGORY_TOPICS };
