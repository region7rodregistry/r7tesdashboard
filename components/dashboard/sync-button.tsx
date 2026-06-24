"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncAction } from "@/app/actions";
import { AddedRecordsModal } from "./added-records-modal";
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
        toast.success(
          n > 0 ? `Added ${n} new record${n === 1 ? "" : "s"}` : "No new records to add",
          {
            id: toastId,
            description:
              n > 0
                ? "New people from the sheet were appended to the registry."
                : "Everyone in the sheet is already in the registry.",
          },
        );
        router.refresh();
        if (n > 0) {
          setAdded(result.added);
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

      <AddedRecordsModal records={added} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
