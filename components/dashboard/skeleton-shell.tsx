import * as React from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Static, data-free copy of <AppShell>'s chrome used by the route-level
 * loading.tsx skeletons. The logo, title and layout are real so the page
 * frame stays put while data streams in; the data-dependent bits (nav state,
 * sync button, source badge) render as pulse placeholders against the navy
 * header (bg-white/20 so they're visible on the dark gradient).
 */
export function SkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="bg-tesda-header sticky top-0 z-40 border-b border-black/20 text-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/tlogo.png"
              alt="TESDA"
              width={40}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
            <div className="leading-tight">
              <p className="text-sm font-bold sm:text-base">NTTC Registry</p>
              <p className="flex items-center gap-1 text-xs text-sky-200">
                <MapPin className="size-3" />
                TESDA Region VII · Central Visayas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md bg-white/20" />
            <Skeleton className="h-8 w-24 rounded-md bg-white/20" />
            <Skeleton className="size-8 rounded-md bg-white/20" />
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/15 px-4 py-1 sm:px-6">
          <div className="mx-auto flex max-w-[1600px] items-center justify-end">
            <Skeleton className="h-5 w-28 rounded-full bg-white/20" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© TESDA Region VII · National TVET Trainer&rsquo;s Certificate Registry</p>
          <Skeleton className="h-4 w-40" />
        </div>
      </footer>
    </div>
  );
}
