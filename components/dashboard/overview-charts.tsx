"use client";

import { ShieldCheck, ClipboardCheck, MapPin, Building2, Layers } from "lucide-react";
import { PieChart } from "./pie-chart";
import { BarList } from "./bar-list";
import type { OverviewCharts as OverviewChartsData } from "@/lib/overview-stats";

// Semantic tones for validity status, aligned to the dashboard's status palette
// (emerald / amber / rose / slate). Keyed on STATUS_META labels.
const STATUS_COLORS: Record<string, string> = {
  Valid: "#10b981",
  "Expiring Soon": "#f59e0b",
  Expired: "#f43f5e",
  "No Date": "#94a3b8",
};

export function OverviewCharts({ data }: { data: OverviewChartsData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PieChart
          title="NTTC certification status"
          data={data.nttcValidity}
          colors={STATUS_COLORS}
          unit="trainers"
          icon={<ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <PieChart
          title="Assessment-center accreditations"
          data={data.centerValidity}
          colors={STATUS_COLORS}
          unit="accreditations"
          icon={<ClipboardCheck className="size-4 text-amber-600 dark:text-amber-400" />}
        />
        <BarList
          title="Certified trainers by province"
          data={data.trainersByProvince}
          unit="trainers"
          icon={<MapPin className="size-4 text-sky-600 dark:text-sky-400" />}
        />
        <BarList
          title="Assessment centers by province"
          data={data.centersByProvince}
          unit="centers"
          icon={<Building2 className="size-4 text-violet-600 dark:text-violet-400" />}
        />
      </div>

      <BarList
        title="Top TVET sectors by certified trainers"
        data={data.topSectors}
        unit="trainers"
        caption={`${data.sectorCount} sectors`}
        icon={<Layers className="size-4 text-rose-600 dark:text-rose-400" />}
      />
    </div>
  );
}
