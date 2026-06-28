import { AppSidebar } from "@/components/layout/app-sidebar";

/**
 * Authenticated app shell: a persistent navy sidebar (TESDA chrome) with the
 * content area offset on desktop. /login lives outside this route group, so it
 * never gets the sidebar.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30">
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
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
    </div>
  );
}
