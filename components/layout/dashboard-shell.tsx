"use client";

import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

// The content column reclaims the rail's 64-width when the sidebar is hidden.
// Both the padding here and the rail's transform animate over the same duration
// + easing, so they slide in lockstep.
function ShellContent({ children }: { children: React.ReactNode }) {
  const { hidden } = useSidebar();
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        hidden ? "lg:pl-0" : "lg:pl-64",
      )}
    >
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} TESDA Region VII · Regional Dashboard VII</p>
          <p>Central Visayas</p>
        </div>
      </footer>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="bg-muted/30">
        <AppSidebar />
        <ShellContent>{children}</ShellContent>
      </div>
    </SidebarProvider>
  );
}
