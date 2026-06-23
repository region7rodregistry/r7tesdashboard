"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users, MapPin, Layers, GraduationCap, ShieldCheck, Briefcase, RefreshCw, Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart } from "./pie-chart";
import { cn } from "@/lib/utils";
import type { NttcRecord } from "@/lib/columns";
import { validityStatus, type ValidityStatus } from "@/lib/nttc";
import {
  byProvince, bySector, byQualification, byValidity, byEmploymentType, byNttcType, byInstitutionType,
  topNWithOther,
} from "@/lib/stats";

const TOP_N = 10;

type StatusFilter = "all" | ValidityStatus;
const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "valid", label: "Valid" },
  { key: "expiring", label: "Expiring" },
  { key: "expired", label: "Expired" },
];

export function StatisticsView({ records }: { records: NttcRecord[] }) {
  const [status, setStatus] = React.useState<StatusFilter>("all");

  const counted = React.useMemo(
    () => (status === "all" ? records : records.filter((r) => validityStatus(r) === status)),
    [records, status],
  );

  const provinceAll = React.useMemo(() => byProvince(counted), [counted]);
  const sectorAll = React.useMemo(() => bySector(counted), [counted]);
  const qualAll = React.useMemo(() => byQualification(counted), [counted]);
  const validityData = React.useMemo(() => byValidity(counted), [counted]);
  const employmentData = React.useMemo(() => byEmploymentType(counted), [counted]);
  const nttcTypeData = React.useMemo(() => byNttcType(counted), [counted]);
  const institutionData = React.useMemo(() => byInstitutionType(counted), [counted]);

  const sectorData = React.useMemo(() => topNWithOther(sectorAll, TOP_N), [sectorAll]);
  const qualData = React.useMemo(() => topNWithOther(qualAll, TOP_N), [qualAll]);

  const summary = [
    { label: "Records", value: counted.length, icon: Users, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
    { label: "Provinces", value: provinceAll.length, icon: MapPin, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
    { label: "Sectors", value: sectorAll.length, icon: Layers, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15" },
    { label: "Qualifications", value: qualAll.length, icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Distribution of NTTC holders across Region VII — Central Visayas.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
          >
            <Card className="flex-row items-center gap-4 p-5">
              <div className={`flex size-12 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tnum">{s.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={status === t.key ? "default" : "outline"}
            onClick={() => setStatus(t.key)}
            className={cn(status === t.key && "pointer-events-none")}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Charts */}
      {counted.length === 0 ? (
        <Card className="min-h-[30vh] items-center justify-center gap-2 p-8 text-muted-foreground">
          <Layers className="size-10" />
          <p>No records to chart for this filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <PieChart title="By Province" data={provinceAll} icon={<MapPin className="size-4 text-amber-600 dark:text-amber-400" />} />
          <PieChart title="By Validity Status" data={validityData} icon={<ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />} />
          <PieChart title="By Sector" data={sectorData} totalCategories={sectorAll.length} icon={<Layers className="size-4 text-violet-600 dark:text-violet-400" />} />
          <PieChart title="By Employment Type" data={employmentData} icon={<Briefcase className="size-4 text-sky-600 dark:text-sky-400" />} />
          <PieChart title="By Institution Type" data={institutionData} icon={<Building2 className="size-4 text-cyan-600 dark:text-cyan-400" />} />
          <PieChart title="New vs. Renewal" data={nttcTypeData} icon={<RefreshCw className="size-4 text-rose-600 dark:text-rose-400" />} />
          <PieChart
            title="By Qualification"
            data={qualData}
            totalCategories={qualAll.length}
            icon={<GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />}
            className="xl:col-span-2"
          />
        </div>
      )}
    </div>
  );
}
