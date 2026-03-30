"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface BookGroup {
  label: string;
  books: { slug: string; abbr: string }[];
}

export const BOOK_GROUPS: BookGroup[] = [
  {
    label: "Core",
    books: [{ slug: "phb", abbr: "PHB" }],
  },
  {
    label: "Complete Handbooks",
    books: [
      { slug: "phbr01", abbr: "CFH" },
      { slug: "phbr02", abbr: "CTH" },
      { slug: "phbr03", abbr: "CPH" },
      { slug: "phbr04", abbr: "CWH" },
      { slug: "phbr05", abbr: "CPsH" },
      { slug: "phbr06", abbr: "CDwH" },
      { slug: "phbr07", abbr: "CBH" },
      { slug: "phbr08", abbr: "CEH" },
      { slug: "phbr09", abbr: "CGnH" },
      { slug: "phbr10", abbr: "CHuH" },
      { slug: "phbr11", abbr: "CRH" },
      { slug: "phbr12", abbr: "CPaH" },
      { slug: "phbr13", abbr: "CDrH" },
      { slug: "phbr14", abbr: "CBarH" },
    ],
  },
  {
    label: "Spell Compendia",
    books: [
      { slug: "wsc1", abbr: "WSC1" },
      { slug: "wsc2", abbr: "WSC2" },
      { slug: "wsc3", abbr: "WSC3" },
      { slug: "wsc4", abbr: "WSC4" },
      { slug: "psc1", abbr: "PSC1" },
      { slug: "psc2", abbr: "PSC2" },
      { slug: "psc3", abbr: "PSC3" },
    ],
  },
  {
    label: "Other",
    books: [
      { slug: "tom", abbr: "ToM" },
      { slug: "aeg", abbr: "AEG" },
      { slug: "po-sp", abbr: "PO:S&P" },
      { slug: "po-sm", abbr: "PO:S&M" },
      { slug: "boa", abbr: "BoA" },
      { slug: "me1", abbr: "ME1" },
      { slug: "me2", abbr: "ME2" },
    ],
  },
];

const ALL_SLUGS = BOOK_GROUPS.flatMap((g) => g.books.map((b) => b.slug));

interface BookFilterProps {
  selectedBooks: string[];
  onToggle: (slug: string) => void;
  onSelectAll: () => void;
}

export function BookFilter({ selectedBooks, onToggle, onSelectAll }: BookFilterProps) {
  const t = useTranslations("rulebook");
  const allSelected = selectedBooks.length === 0 || selectedBooks.length === ALL_SLUGS.length;

  return (
    <div className="space-y-2 px-3 pb-2" data-testid="book-filter">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t("filterBooks")}:</span>
        <button
          type="button"
          onClick={onSelectAll}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs transition-colors",
            allSelected
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
          data-testid="book-filter-all"
        >
          {t("allBooks")}
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {BOOK_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-wrap gap-1">
            {group.books.map((book) => {
              const isActive = allSelected || selectedBooks.includes(book.slug);
              return (
                <button
                  key={book.slug}
                  type="button"
                  onClick={() => onToggle(book.slug)}
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary/90 border border-primary/20"
                      : "bg-muted/30 text-muted-foreground/50 border border-transparent hover:bg-muted/50"
                  )}
                  data-testid={`book-filter-${book.slug}`}
                >
                  {book.abbr}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ALL_SLUGS };
