"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function PaginationBar({ page, totalPages, onPage }: PaginationBarProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page">
        <ChevronLeft className="size-4" /> Prev
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid h-8 min-w-8 place-items-center rounded-md px-2.5 text-sm font-medium transition-colors tnum",
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Next page">
        Next <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
