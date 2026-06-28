import {
  Users,
  ShieldCheck,
  Clock,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import { getRegistry } from "@/lib/data";
import { computeStats } from "@/lib/nttc";
import { getUtprasRegistry } from "@/lib/utpras-data";
import { getAssessmentCenters } from "@/lib/ptcacs-data";
import { getUnifiedSchools, computeUnifiedOverview } from "@/lib/schools-unified";
import { computeOverviewCharts } from "@/lib/overview-stats";
import { OverviewTabs } from "@/components/dashboard/overview-tabs";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Reads the live registries for the headline numbers + unified school directory.
export const dynamic = "force-dynamic";

interface Tile {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default async function OverviewPage() {
  const [{ records: nttc, source }, { records: utpras }, { records: centers }] = await Promise.all([
    getRegistry(),
    getUtprasRegistry(),
    getAssessmentCenters(),
  ]);

  const stats = computeStats(nttc);
  const schools = getUnifiedSchools(utpras, centers);
  const schoolsOverview = computeUnifiedOverview(schools);
  const charts = computeOverviewCharts(nttc, centers);

  const tiles: Tile[] = [
    { label: "NTTC Holders", value: stats.total, icon: Users, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
    { label: "Valid", value: stats.valid, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
    { label: "Expiring Soon", value: stats.expiring, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
    { label: "Expired", value: stats.expired, icon: CircleSlash, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/15" },
  ];

  const summary = (
    <>
      {/* Live NTTC headline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">NTTC at a glance</h2>
          <Badge
            variant="outline"
            className={
              source === "supabase"
                ? "border-emerald-500/30 text-[11px] text-emerald-600 dark:text-emerald-400"
                : "text-[11px] text-muted-foreground"
            }
          >
            {source === "supabase" ? "Live · Supabase" : "Local snapshot"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <Card key={t.label} className="flex-row items-center gap-4 p-5">
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.color}`}>
                <t.icon className="size-6" />
              </div>
              <div>
                <p className="tnum text-2xl font-bold">{t.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Regional snapshot — cross-registry charts that no single module shows */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">Regional snapshot</h2>
          <p className="text-xs text-muted-foreground">
            Certification &amp; accreditation health and where capacity sits across Central Visayas.
          </p>
        </div>
        <OverviewCharts data={charts} />
      </section>
    </>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Regional Dashboard VII · TESDA Region VII · Central Visayas
        </p>
      </header>

      <OverviewTabs summary={summary} schools={schools} overview={schoolsOverview} />
    </div>
  );
}
