"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AddedRecord } from "@/lib/sync";

const STATUS_DOT: Record<AddedRecord["status"], string> = {
  valid: "bg-emerald-500",
  expiring: "bg-amber-500",
  expired: "bg-rose-500",
  unknown: "bg-muted-foreground/40",
};

const STATUS_TEXT: Record<AddedRecord["status"], string> = {
  valid: "text-emerald-600 dark:text-emerald-400",
  expiring: "text-amber-600 dark:text-amber-400",
  expired: "text-rose-600 dark:text-rose-400",
  unknown: "text-muted-foreground",
};

interface AddedRecordsModalProps {
  records: AddedRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddedRecordsModal({ records, open, onOpenChange }: AddedRecordsModalProps) {
  const n = records.length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div className="flex max-h-[85vh] flex-col">
          {/* Header */}
          <div className="bg-tesda-header relative overflow-hidden px-6 py-5 text-white">
            <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-200">
              <Sparkles className="size-3.5" /> Sync Complete
            </div>
            <DialogTitle className="relative mt-1 text-2xl font-semibold">
              {n} {n === 1 ? "record" : "records"} added
            </DialogTitle>
            <DialogDescription className="relative mt-0.5 text-sky-100/90">
              New NTTC holders from the latest Google Sheets sync.
            </DialogDescription>
          </div>

          {/* List */}
          <div className="scroll-fancy min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <ul className="flex flex-col gap-2">
              {records.map((r, i) => (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.5), duration: 0.25, ease: "easeOut" }}
                  className="rounded-lg border border-border bg-card/60 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {r.name || "—"}
                    </p>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium tnum",
                        STATUS_TEXT[r.status],
                      )}
                      title="Validity (NTTC expiration)"
                    >
                      <span className={cn("size-1.5 rounded-full", STATUS_DOT[r.status])} />
                      {r.validity}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {r.qualification || "—"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {r.sector && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                        {r.sector}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-mono text-muted-foreground tnum">
                      <Hash className="size-3" /> {r.cln || "—"}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
