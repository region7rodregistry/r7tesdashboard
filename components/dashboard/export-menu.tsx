"use client";

import * as React from "react";
import { Download, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExportMenuItem {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  /** May be async (Excel/PDF generation); the menu shows a spinner until it settles. */
  onSelect: () => void | Promise<void>;
}

interface ExportMenuProps {
  items: ExportMenuItem[];
  label?: string;
  align?: "start" | "end";
  disabled?: boolean;
  triggerClassName?: string;
}

/**
 * Small self-contained dropdown (the project has no dropdown-menu primitive).
 * Closes on outside-click or Escape; disables itself while an export runs.
 */
export function ExportMenu({
  items,
  label = "Export",
  align = "end",
  disabled,
  triggerClassName,
}: ExportMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (item: ExportMenuItem) => {
    if (busyKey) return;
    setBusyKey(item.key);
    try {
      await item.onSelect();
    } finally {
      setBusyKey(null);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || busyKey !== null}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        {busyKey ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {label}
        <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-[16rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={busyKey !== null}
              onClick={() => run(item)}
              className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                {busyKey === item.key ? <Loader2 className="size-4 animate-spin" /> : item.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-medium leading-tight">{item.label}</span>
                {item.description && (
                  <span className="mt-0.5 text-xs text-muted-foreground">{item.description}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
