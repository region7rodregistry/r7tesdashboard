import Link from "next/link";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  Clock,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import { getRegistry } from "@/lib/data";
import { computeStats } from "@/lib/nttc";
import { SECTIONS, type Section } from "@/lib/sections";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Reads the live registry for the NTTC headline numbers.
export const dynamic = "force-dynamic";

interface Tile {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default async function OverviewPage() {
  const { records, source } = await getRegistry();
  const stats = computeStats(records);

  const tiles: Tile[] = [
    { label: "NTTC Holders", value: stats.total, icon: Users, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
    { label: "Valid", value: stats.valid, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
    { label: "Expiring Soon", value: stats.expiring, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
    { label: "Expired", value: stats.expired, icon: CircleSlash, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/15" },
  ];

  const modules = SECTIONS.filter((s) => s.key !== "overview");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Regional Dashboard VII · TESDA Region VII · Central Visayas
        </p>
      </header>

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

      {/* Module grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((s) => (
            <ModuleCard
              key={s.key}
              section={s}
              meta={s.key === "nttc" ? `${stats.total.toLocaleString()} certificate holders` : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ section, meta }: { section: Section; meta?: string }) {
  const Icon = section.icon;
  return (
    <Link href={section.href} className="group">
      <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:ring-foreground/20">
        <div className="flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-border">
            <Icon className="size-5" />
          </div>
          {section.available ? (
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Soon
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{section.label}</h3>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
        {meta && <p className="text-xs font-medium text-muted-foreground">{meta}</p>}
      </Card>
    </Link>
  );
}
