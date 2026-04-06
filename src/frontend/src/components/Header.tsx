import { Button } from "@/components/ui/button";
import { Moon, Newspaper, Sun } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "HI" },
  { code: "ta", label: "TA" },
  { code: "te", label: "TE" },
  { code: "bn", label: "BN" },
  { code: "mr", label: "MR" },
  { code: "gu", label: "GU" },
  { code: "kn", label: "KN" },
  { code: "ml", label: "ML" },
  { code: "pa", label: "PA" },
];

const PRIMARY_LANGS = ["en", "hi"];

interface HeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  lastUpdated?: string;
}

export function Header({
  language,
  onLanguageChange,
  darkMode,
  onDarkModeToggle,
  lastUpdated,
}: HeaderProps) {
  return (
    <header className="bg-news-red text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Newspaper
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              aria-hidden="true"
            />
            <div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-none">
                ACE8 NEWS
              </h1>
              <p className="text-white/80 text-[11px] sm:text-xs font-medium tracking-wide mt-0.5">
                All News in One Place
              </p>
              {lastUpdated && (
                <p className="text-white/50 text-[9px] hidden sm:block">
                  Updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Primary language buttons (EN, HI) */}
            <fieldset className="flex items-center gap-1 border-0 p-0 m-0">
              <legend className="sr-only">Primary language selection</legend>
              {LANGUAGES.filter((l) => PRIMARY_LANGS.includes(l.code)).map(
                (lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    data-ocid={`header.${lang.code}.button`}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                      language === lang.code
                        ? "bg-white text-news-red shadow-sm"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                    aria-pressed={language === lang.code}
                    aria-label={lang.code === "en" ? "English" : "Hindi"}
                  >
                    {lang.label}
                  </button>
                ),
              )}
            </fieldset>

            {/* Secondary language buttons (other Indian languages) */}
            <fieldset className="hidden md:flex items-center gap-1 flex-wrap border-0 p-0 m-0">
              <legend className="sr-only">Other language selection</legend>
              {LANGUAGES.filter((l) => !PRIMARY_LANGS.includes(l.code)).map(
                (lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    data-ocid={`header.${lang.code}.button`}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      language === lang.code
                        ? "bg-white text-news-red"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                    aria-pressed={language === lang.code}
                  >
                    {lang.label}
                  </button>
                ),
              )}
            </fieldset>

            {/* Mobile: compact language select for non-primary languages */}
            <div className="flex md:hidden">
              <select
                value={
                  LANGUAGES.find(
                    (l) =>
                      !PRIMARY_LANGS.includes(l.code) && l.code === language,
                  )?.code || ""
                }
                onChange={(e) => {
                  if (e.target.value) onLanguageChange(e.target.value);
                }}
                className="bg-white/20 text-white text-xs rounded px-2 py-1 border border-white/20 focus:outline-none"
                data-ocid="header.language.select"
                aria-label="Select language"
              >
                <option value="" className="text-black">
                  More...
                </option>
                {LANGUAGES.filter((l) => !PRIMARY_LANGS.includes(l.code)).map(
                  (lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="text-black"
                    >
                      {lang.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDarkModeToggle}
              data-ocid="header.darkmode.toggle"
              className="text-white hover:bg-white/20 rounded-full w-8 h-8"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
