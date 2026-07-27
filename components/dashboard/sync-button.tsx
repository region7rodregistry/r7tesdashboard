"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncAction } from "@/app/actions";
import { SyncResultsModal } from "./added-records-modal";
import type { AddedRecord } from "@/lib/sync";

interface SyncButtonProps {
  /** Whether Supabase service-role is configured server-side. */
  enabled: boolean;
  className?: string;
}

export function SyncButton({ enabled, className }: SyncButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [added, setAdded] = React.useState<AddedRecord[]>([]);
  const [updated, setUpdated] = React.useState<AddedRecord[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);

  function runSync() {
    if (!enabled || pending) return;
    const toastId = toast.loading("Syncing from Google Sheets…");
    startTransition(async () => {
      try {
        const result = await syncAction();
        if (!result.ok) {
          toast.error("Sync failed", { id: toastId, description: result.error });
          return;
        }
        const n = result.added.length;
        const u = result.updated.length;
        const parts = [
          n > 0 && `Added ${n} new record${n === 1 ? "" : "s"}`,
          u > 0 && `updated ${u} existing record${u === 1 ? "" : "s"}`,
        ].filter(Boolean);
        toast.success(parts.length > 0 ? parts.join(", ") : "Registry is up to date", {
          id: toastId,
          description:
            parts.length > 0
              ? "Changes from the sheet were applied to the registry."
              : "Everyone in the sheet is already in the registry with the same details.",
        });
        router.refresh();
        if (n > 0 || u > 0) {
          setAdded(result.added);
          setUpdated(result.updated);
          setModalOpen(true);
        }
      } catch (err) {
        toast.error("Sync failed", {
          id: toastId,
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });
  }

  return (
    <>
      <Button
        onClick={runSync}
        disabled={!enabled || pending}
        variant="secondary"
        size="sm"
        className={cn("bg-white/15 text-white hover:bg-white/25 disabled:opacity-60", className)}
        title={
          enabled
            ? "Pull the latest data from Google Sheets (adds new rows, updates existing — never deletes)"
            : "Configure SUPABASE_SERVICE_ROLE_KEY to enable Sync"
        }
      >
        {!enabled ? (
          <CloudOff className="size-4" />
        ) : (
          <RefreshCw className={cn("size-4", pending && "animate-spin")} />
        )}
        <span className="hidden sm:inline">{pending ? "Syncing…" : "Sync"}</span>
      </Button>

      <SyncResultsModal added={added} updated={updated} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
