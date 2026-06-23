"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookMarked, ChartPie, Database, HardDrive, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SyncButton } from "./sync-button";
import { cn } from "@/lib/utils";

interface AppShellProps {
  source: "supabase" | "local";
  syncEnabled: boolean;
  children: React.ReactNode;
}

const NAV = [
  { label: "Registry", href: "/", icon: BookMarked },
  { label: "Statistics", href: "/statistics", icon: ChartPie },
];

export function AppShell({ source, syncEnabled, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="bg-tesda-header sticky top-0 z-40 border-b border-black/20 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>

          <div className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Button
                  key={n.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-sky-100 hover:bg-white/10 hover:text-white",
                    active && "bg-white/15 text-white",
                  )}
                >
                  <Link href={n.href}>
                    <n.icon className="size-4" />
                    <span className="hidden sm:inline">{n.label}</span>
                  </Link>
                </Button>
              );
            })}
            <SyncButton enabled={syncEnabled} />
            <ThemeToggle className="text-sky-100 hover:bg-white/10 hover:text-white" />
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/15 px-4 py-1 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-end">
            <Badge
              variant="outline"
              className={cn(
                "gap-1 border-white/20 text-[11px]",
                source === "supabase" ? "text-emerald-200" : "text-sky-200",
              )}
            >
              {source === "supabase" ? (
                <>
                  <Database className="size-3" /> Live · Supabase
                </>
              ) : (
                <>
                  <HardDrive className="size-3" /> Local snapshot
                </>
              )}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} TESDA Region VII · National TVET Trainer&rsquo;s Certificate Registry</p>
          <p>
            Data source:{" "}
            <span className="font-medium text-foreground">
              {source === "supabase" ? "Supabase (live)" : "Bundled snapshot"}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
