"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, UserCheck, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Assessment Centers", href: "/ptcacs/centers", icon: Building2 },
  { label: "Assessors", href: "/ptcacs/assessors", icon: UserCheck },
];

// Matches the sidebar's sliding-indicator feel.
const TAB_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/**
 * Section header for the PTCACs module. Lives in the PTCACs layout so it
 * persists across the Assessment Centers / Assessors tabs — which lets the
 * active-tab indicator slide smoothly between them (shared layoutId) instead of
 * hard-cutting. Each tab's body owns its own data-source badge.
 */
export function PtcacsHeader() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ClipboardCheck className="size-6 text-primary" />
          PTCACs
        </h1>
        <p className="text-sm text-muted-foreground">
          Accredited Competency Assessment Centers &amp; Assessors · TESDA Region VII
        </p>
      </div>

      <div className="flex rounded-lg bg-muted p-1">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="ptcacs-tab-pill"
                  transition={TAB_SPRING}
                  className="absolute inset-0 rounded-md bg-card shadow-sm"
                />
              )}
              <t.icon className="relative z-10 size-4" />
              <span className="relative z-10">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
