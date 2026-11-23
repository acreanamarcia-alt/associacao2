import { ArrowUpRight, CalendarClock, FileText, Search, Tag, X } from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  dispatchSiteSearchNavigation,
  LOCAL_SEARCH_KEYWORDS,
  searchSiteContent,
  SiteSearchItem,
} from '../data/siteSearchIndex';
import { useLanguage } from '../i18n/LanguageContext';

export function TopSiteSearchBar() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchSiteContent(query), [query]);

  const eventResults = useMemo(
    () => results.filter((item) => item.category === 'event'),
    [results]
  );
  const postResults = useMemo(
    () => results.filter((item) => item.category === 'post'),
    [results]
  );

  // Ordered list matches visual order in dropdown (events first, then posts)
  const orderedResults = useMemo(
    () => [...eventResults, ...postResults],
    [eventResults, postResults]
  );

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleGlobalKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
        return;
      }

      // Quick focus shortcut "/" when not typing inside an input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditable =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement | null)?.isContentEditable;

      if (event.key === '/' && !isEditable && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleGlobalKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  const handleSelectResult = (item: SiteSearchItem) => {
    setIsOpen(false);
    dispatchSiteSearchNavigation(item);
  };

  const handleApplyKeyword = (keywordQuery: string) => {
    setQuery(keywordQuery);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setIsOpen(true);
    }

    if (orderedResults.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % orderedResults.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? orderedResults.length - 1 : prev - 1
      );
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      const chosen = orderedResults[highlightedIndex];
      if (chosen) handleSelectResult(chosen);
    } else if (event.key === 'Enter' && orderedResults.length === 1) {
      event.preventDefault();
      handleSelectResult(orderedResults[0]);
    }
  };

  const trimmedQuery = query.trim();

  return (
    <div className="border-t border-[#EFEBE3] bg-[#F4F0E8]/75">
      <div className="mx-auto flex max-w-[1340px] flex-col gap-2 px-5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div ref={containerRef} className="relative w-full sm:max-w-xl">
          <label htmlFor="site-top-search" className="sr-only">
            {t.search.ariaLabel}
          </label>
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#14532D]"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id="site-top-search"
              type="search"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="site-top-search-results"
              aria-autocomplete="list"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={t.search.placeholder}
              className="h-9 w-full rounded-md border border-[#D6CEBE] bg-white py-1.5 pr-14 pl-8.5 text-xs text-[#1C1917] placeholder:text-[#78716C] transition-colors focus:border-[#14532D] focus:outline-none"
            />

            {trimmedQuery ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                  setIsOpen(true);
                }}
                aria-label={t.search.clearBtn}
                className="absolute right-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[#57534E] hover:bg-[#EFEBE3] hover:text-[#1C1917]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 hidden rounded border border-[#D6CEBE] bg-[#FBF9F5] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#78716C] sm:inline-block"
              >
                /
              </kbd>
            )}
          </div>

          {isOpen && (
            <div
              id="site-top-search-results"
              role="listbox"
              aria-label={t.search.ariaLabel}
              className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg border border-[#D6CEBE] bg-white shadow-lg"
            >
              {!trimmedQuery ? (
                <div className="p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                    <Tag className="h-3 w-3 text-[#14532D]" aria-hidden="true" />
                    <span>{t.search.keywordsTitle}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {LOCAL_SEARCH_KEYWORDS.map((kw) => (
                      <button
                        key={kw.label}
                        type="button"
                        onClick={() => handleApplyKeyword(kw.query)}
                        className="cursor-pointer rounded-md border border-[#E2DDD3] bg-[#FBF9F5] px-2.5 py-1 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#14532D] hover:bg-[#F0FDF4] hover:text-[#14532D]"
                      >
                        {kw.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : orderedResults.length === 0 ? (
                <div className="p-4">
                  <p className="text-xs font-medium text-[#1C1917]">
                    {t.search.noResults} &ldquo;{trimmedQuery}&rdquo;.
                  </p>
                  <p className="mt-1 text-[11px] text-[#57534E]">
                    {t.search.tryKeywords}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {LOCAL_SEARCH_KEYWORDS.slice(0, 6).map((kw) => (
                      <button
                        key={kw.label}
                        type="button"
                        onClick={() => handleApplyKeyword(kw.query)}
                        className="cursor-pointer rounded-md border border-[#E2DDD3] bg-[#FBF9F5] px-2.5 py-1 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#14532D] hover:bg-[#F0FDF4] hover:text-[#14532D]"
                      >
                        {kw.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#EFEBE3]">
                  {eventResults.length > 0 && (
                    <div className="p-2">
                      <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#14532D]">
                        {t.search.eventsGroup} ({eventResults.length})
                      </p>
                      <div className="space-y-1">
                        {eventResults.map((item) => {
                          const flatIndex = orderedResults.indexOf(item);
                          const isHighlighted = flatIndex === highlightedIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              onClick={() => handleSelectResult(item)}
                              className={`flex w-full cursor-pointer items-start justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                                isHighlighted
                                  ? 'bg-[#F0FDF4] text-[#1C1917]'
                                  : 'hover:bg-[#FBF9F5]'
                              }`}
                            >
                              <div className="flex min-w-0 items-start gap-2.5">
                                <CalendarClock
                                  className="mt-0.5 h-4 w-4 shrink-0 text-[#14532D]"
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#14532D]">
                                    {item.badge} · {item.dateOrPeriod}
                                  </p>
                                  <p className="text-xs font-semibold text-[#1C1917]">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#57534E]">
                                    {item.summary}
                                  </p>
                                </div>
                              </div>
                              <ArrowUpRight
                                className="mt-1 h-3.5 w-3.5 shrink-0 text-[#78716C]"
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {postResults.length > 0 && (
                    <div className="p-2">
                      <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#9A3412]">
                        {t.search.postsGroup} ({postResults.length})
                      </p>
                      <div className="space-y-1">
                        {postResults.map((item) => {
                          const flatIndex = orderedResults.indexOf(item);
                          const isHighlighted = flatIndex === highlightedIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              onClick={() => handleSelectResult(item)}
                              className={`flex w-full cursor-pointer items-start justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                                isHighlighted
                                  ? 'bg-[#FFF7ED] text-[#1C1917]'
                                  : 'hover:bg-[#FBF9F5]'
                              }`}
                            >
                              <div className="flex min-w-0 items-start gap-2.5">
                                <FileText
                                  className="mt-0.5 h-4 w-4 shrink-0 text-[#9A3412]"
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#9A3412]">
                                    {item.badge} · {item.dateOrPeriod}
                                  </p>
                                  <p className="text-xs font-semibold text-[#1C1917]">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#57534E]">
                                    {item.summary}
                                  </p>
                                </div>
                              </div>
                              <ArrowUpRight
                                className="mt-1 h-3.5 w-3.5 shrink-0 text-[#78716C]"
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline curated keyword shortcuts on desktop so popular topics are 1 click away */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto text-[11px] text-[#57534E]">
          <span className="shrink-0 font-medium text-[#78716C]">{t.search.quickTagsLabel}:</span>
          {LOCAL_SEARCH_KEYWORDS.slice(0, 5).map((kw) => (
            <button
              key={kw.label}
              type="button"
              onClick={() => handleApplyKeyword(kw.query)}
              className="shrink-0 cursor-pointer rounded border border-[#D6CEBE] bg-white px-2 py-0.5 font-medium text-[#44403C] transition-colors hover:border-[#14532D] hover:text-[#14532D]"
            >
              {kw.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
