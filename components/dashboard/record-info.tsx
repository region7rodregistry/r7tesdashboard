import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the record-detail modals (UTPRAS / PTCACs): a
 * labeled value that renders a muted em-dash when empty, and a responsive
 * two-column section grid.
 */
export function InfoItem({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  const empty = value === "" || value === null || value === undefined || value === "—";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-sm leading-snug",
          empty ? "text-muted-foreground/60" : "text-foreground",
          mono && "font-mono text-[0.82rem] tnum",
        )}
      >
        {empty ? "—" : value}
      </span>
    </div>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>;
}
