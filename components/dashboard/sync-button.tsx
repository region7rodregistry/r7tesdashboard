"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncAction } from "@/app/actions";

interface SyncButtonProps {
  /** Whether Supabase service-role is configured server-side. */
  enabled: boolean;
  className?: string;
}

export function SyncButton({ enabled, className }: SyncButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

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
        toast.success(`Synced ${result.count} records from Google Sheets`, {
          id: toastId,
          description: "Supabase has been overwritten with the latest sheet data.",
        });
        router.refresh();
      } catch (err) {
        toast.error("Sync failed", {
          id: toastId,
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });
  }

  return (
    <Button
      onClick={runSync}
      disabled={!enabled || pending}
      variant="secondary"
      size="sm"
      className={cn("bg-white/15 text-white hover:bg-white/25 disabled:opacity-60", className)}
      title={
        enabled
          ? "Pull the latest data from Google Sheets and overwrite Supabase"
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
  );
}
