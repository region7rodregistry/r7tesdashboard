"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SECTIONS } from "@/lib/sections";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/login/actions";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// Spring used by the sliding active-indicator pill.
const PILL_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

function NavLinks({
  pathname,
  idPrefix,
  onNavigate,
}: {
  pathname: string;
  /** Namespaces the layoutId so the desktop rail and mobile drawer animate independently. */
  idPrefix: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {SECTIONS.map((s) => {
        const active = isActive(pathname, s.href);
        return (
          <Link
            key={s.key}
            href={s.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
              active ? "text-white" : "text-sky-100/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${idPrefix}-active-pill`}
                transition={PILL_SPRING}
                className="absolute inset-0 rounded-lg bg-white/15"
              />
            )}
            <s.icon className="relative z-10 size-4 shrink-0" />
            <span className="relative z-10">{s.label}</span>
            {!s.available && (
              <span className="relative z-10 ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-sky-200/80">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** The shared sidebar surface — used by both the desktop rail and mobile drawer. */
function SidebarBody({
  pathname,
  idPrefix,
  onNavigate,
  onHide,
}: {
  pathname: string;
  idPrefix: string;
  onNavigate?: () => void;
  /** Desktop only — collapses the rail. */
  onHide?: () => void;
}) {
  return (
    <div className="bg-tesda-header flex h-full flex-col text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white">
          <Image
            src="/icons/tlogo.png"
            alt="TESDA"
            width={32}
            height={32}
            className="size-8 object-contain"
            priority
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">Regional Dashboard VII</p>
          <p className="text-xs text-sky-200">TESDA Region VII</p>
        </div>
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            aria-label="Hide sidebar"
            title="Hide sidebar"
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-md text-sky-100/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            <PanelLeftClose className="size-5" />
          </button>
        )}
      </div>

      <NavLinks pathname={pathname} idPrefix={idPrefix} onNavigate={onNavigate} />

      <div className="flex items-center gap-2 border-t border-white/10 p-3">
        <form action={logoutAction} className="flex-1">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sky-100 hover:bg-white/10 hover:text-white dark:hover:bg-white/10 focus-visible:ring-white/70"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
        <ThemeToggle className="shrink-0 text-sky-100 hover:bg-white/10 hover:text-white dark:hover:bg-white/10 focus-visible:ring-white/70" />
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { hidden, setHidden } = useSidebar();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop rail — fixed; content gets lg:pl-64 in the layout. Slides out
          (and back) when hidden, in step with the content's padding. */}
      <aside
        aria-hidden={hidden || undefined}
        inert={hidden}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-64 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          hidden && "lg:-translate-x-full",
        )}
      >
        <SidebarBody pathname={pathname} idPrefix="desktop" onHide={() => setHidden(true)} />
      </aside>

      {/* Floating "show" button — appears (desktop only) when the rail is hidden. */}
      <AnimatePresence>
        {hidden && (
          <motion.button
            key="show-sidebar"
            type="button"
            onClick={() => setHidden(false)}
            aria-label="Show sidebar"
            title="Show sidebar"
            initial={{ opacity: 0, x: -14, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -14, scale: 0.85 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-3 top-3 z-50 hidden size-10 place-items-center rounded-xl bg-card text-foreground shadow-lg ring-1 ring-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:grid"
          >
            <PanelLeftOpen className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile: top bar + Radix drawer (Esc-to-close, focus trap/restore, scroll lock). */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <div className="bg-tesda-header sticky top-0 z-30 flex items-center justify-between border-b border-black/20 px-4 py-3 text-white lg:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/tlogo.png"
              alt="TESDA"
              width={28}
              height={28}
              className="size-7 rounded bg-white object-contain p-0.5"
              priority
            />
            <span className="text-sm font-bold">Regional Dashboard VII</span>
          </div>
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              className="text-sky-100 hover:bg-white/10 hover:text-white dark:hover:bg-white/10 focus-visible:ring-white/70"
            >
              <Menu className="size-5" />
            </Button>
          </Dialog.Trigger>
        </div>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[82%] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300 ease-out lg:hidden"
          >
            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="absolute top-3 right-3 z-10 rounded-md p-1.5 text-sky-100 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
            <SidebarBody pathname={pathname} idPrefix="mobile" onNavigate={() => setOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
