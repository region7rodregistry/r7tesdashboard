import type { Section } from "@/lib/sections";
import { Card } from "@/components/ui/card";

/**
 * Themed placeholder for a section that doesn't have data wired up yet. It
 * already renders the real section header, so dropping in dashboards later is
 * just a matter of replacing the <Card> body.
 */
export function ComingSoon({ section }: { section: Section }) {
  const Icon = section.icon;
  return (
    <div className="space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">{section.label}</h1>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </header>

      <Card className="items-center gap-4 px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary ring-1 ring-border">
          <Icon className="size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Coming soon</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            The {section.label} module is being set up. Its data and dashboards
            will appear here as they’re added.
          </p>
        </div>
      </Card>
    </div>
  );
}
