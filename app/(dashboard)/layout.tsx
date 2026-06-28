import { DashboardShell } from "@/components/layout/dashboard-shell";

/**
 * Authenticated app shell: a persistent navy sidebar (TESDA chrome) with the
 * content area offset on desktop. The rail can be hidden (DashboardShell holds
 * the collapse state so the content reflows in step). /login lives outside this
 * route group, so it never gets the sidebar.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
