"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  MapPin,
  School,
  BookMarked,
  ClipboardCheck,
  Layers2,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "./pagination-bar";
import { UnifiedSchoolDetail } from "./unified-school-detail";
import { locationLabel, type UnifiedSchool, type UnifiedOverview } from "@/lib/schools-unified";
import { cn } from "@/lib/utils";

interface UnifiedSchoolsDashboardProps {
  schools: UnifiedSchool[];
  overview: UnifiedOverview;
}

type RegistryFilter = "all" | "utpras" | "ptcac" | "both";
type SortKey = "name" | "programs" | "accreditations";

const ALL = "__all__";
const PAGE_SIZE = 24;

// Overview tiles double as registry filters (click to scope the directory).
const OVERVIEW_TILES: {
  key: keyof UnifiedOverview;
  registry: RegistryFilter;
  label: string;
  icon: typeof School;
  color: string;
  bg: string;
  ring: string;
}[] = [
  { key: "schools", registry: "all", label: "Schools", icon: School, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15", ring: "ring-sky-500" },
  { key: "inUtpras", registry: "utpras", label: "In UTPRAS", icon: BookMarked, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15", ring: "ring-violet-500" },
  { key: "inPtcac", registry: "ptcac", label: "Assessment Centers", icon: ClipboardCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15", ring: "ring-amber-500" },
  { key: "inBoth", registry: "both", label: "In Both", icon: Layers2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", ring: "ring-emerald-500" },
];

export function UnifiedSchoolsDashboard({ schools, overview }: UnifiedSchoolsDashboardProps) {
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [province, setProvince] = React.useState("all");
  const [sector, setSector] = React.useState("all");
  const [registry, setRegistry] = React.useState<RegistryFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [page, setPage] = React.useState(1);

  const deferredSearch = React.useDeferredValue(search);

  const provinces = React.useMemo(
    () => Array.from(new Set(schools.flatMap((s) => s.provinces))).sort((a, b) => a.localeCompare(b)),
    [schools],
  );
  const sectors = React.useMemo(
    () => Array.from(new Set(schools.flatMap((s) => s.sectors))).sort((a, b) => a.localeCompare(b)),
    [schools],
  );

  const filtered = React.useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const arr = schools.filter((s) => {
      if (registry === "utpras" && !s.inUtpras) return false;
      if (registry === "ptcac" && !s.inPtcac) return false;
      if (registry === "both" && !(s.inUtpras && s.inPtcac)) return false;
      if (province !== "all" && !s.provinces.includes(province)) return false;
      if (sector !== "all" && !s.sectors.includes(sector)) return false;
      if (q) {
        const hay = [
          s.name,
          s.municipalities.join(" "),
          s.provinces.join(" "),
          s.sectors.join(" "),
          s.head,
          s.address,
          s.programs.map((p) => String(p.course_program ?? "")).join(" "),
          s.accreditations.map((a) => String(a.qualification_title ?? "")).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      switch (sortKey) {
        case "programs":
          return b.programs.length - a.programs.length || a.name.localeCompare(b.name);
        case "accreditations":
          return b.accreditations.length - a.accreditations.length || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
      }
    });
    return arr;
  }, [schools, registry, province, sector, deferredSearch, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = React.useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, province, sector, registry, sortKey]);

  const hasFilters = search !== "" || province !== "all" || sector !== "all" || registry !== "all";
  const resetFilters = () => {
    setSearch("");
    setProvince("all");
    setSector("all");
    setRegistry("all");
  };

  const selected = selectedKey ? schools.find((s) => s.key === selectedKey) ?? null : null;
  if (selected) {
    return <UnifiedSchoolDetail key={selected.key} school={selected} onBack={() => setSelectedKey(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Schools</h2>
        <p className="text-sm text-muted-foreground">
          Every training institution across Region VII, joining UTPRAS program registrations and PTCAC
          assessment-center accreditations. Open a school to see all of its data.
        </p>
      </div>

      {/* Overview tiles (click to filter by registry) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {OVERVIEW_TILES.map((t) => {
          const active = registry === t.registry;
          return (
            <motion.button
              key={t.key}
              type="button"
              onClick={() => setRegistry((prev) => (prev === t.registry ? "all" : t.registry))}
              aria-pressed={active}
              title={
                t.registry === "all"
                  ? "Show all schools"
                  : t.registry === "utpras"
                    ? "Show only schools registered in UTPRAS"
                    : t.registry === "ptcac"
                      ? "Show only accredited assessment centers"
                      : "Show only schools in both registries"
              }
              whileHover={{ y: -4 }}
              className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card
                className={cn(
                  "flex-row items-center gap-4 p-5 transition-all",
                  active ? cn("ring-2 shadow-md", t.ring) : "hover:ring-foreground/20",
                )}
              >
                <div className={`flex size-12 items-center justify-center rounded-xl ${t.bg} ${t.color}`}>
                  <t.icon className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold tnum">{overview[t.key].toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="gap-3 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school, head/manager, municipality, address…"
              className="pl-9"
              aria-label="Search schools"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:flex-wrap">
            <Select value={province === "all" ? ALL : province} onValueChange={(v) => setProvince(v === ALL ? "all" : v)}>
              <SelectTrigger className="lg:w-44" aria-label="Filter by province">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Provinces</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sector === "all" ? ALL : sector} onValueChange={(v) => setSector(v === ALL ? "all" : v)}>
              <SelectTrigger className="lg:w-48" aria-label="Filter by sector">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Sectors</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="lg:w-52" aria-label="Sort schools">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A–Z)</SelectItem>
                <SelectItem value="programs">Most programs</SelectItem>
                <SelectItem value="accreditations">Most accreditations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
              <X className="size-4" /> Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Showing{" "}
          <span className="font-semibold text-foreground tnum">{filtered.length.toLocaleString()}</span>
          of <span className="tnum">{schools.length.toLocaleString()}</span> schools
        </div>
      </Card>

      {/* Cards */}
      {pageRows.length === 0 ? (
        <Card className="items-center justify-center gap-3 py-20 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <School className="size-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">No schools match your filters</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or resetting the filters.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageRows.map((s, i) => (
            <SchoolCard key={s.key} school={s} delay={i} onOpen={() => setSelectedKey(s.key)} />
          ))}
        </div>
      )}

      <PaginationBar page={currentPage} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

function SchoolCard({
  school,
  delay,
  onOpen,
}: {
  school: UnifiedSchool;
  delay: number;
  onOpen: () => void;
}) {
  const location = locationLabel(school);
  const sectorLabel =
    school.sectors.length === 0
      ? null
      : school.sectors.length === 1
        ? school.sectors[0]
        : `${school.sectors.length} sectors`;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay, 8) * 0.04 }}
      whileHover={{ y: -4 }}
      className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      title={`Open ${school.name}`}
    >
      <Card className="h-full gap-4 p-5 transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{school.name}</h3>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {school.inUtpras && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <BookMarked className="size-3" /> UTPRAS
            </Badge>
          )}
          {school.inPtcac && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <ClipboardCheck className="size-3" /> Assessment Center
            </Badge>
          )}
          {sectorLabel && (
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              {sectorLabel}
            </Badge>
          )}
        </div>

        {location && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-3 border-t pt-3">
          <Metric
            icon={BookMarked}
            n={school.programs.length}
            noun="program"
            muted={!school.inUtpras}
          />
          <Metric
            icon={ClipboardCheck}
            n={school.accreditations.length}
            noun="accreditation"
            muted={!school.inPtcac}
          />
        </div>
      </Card>
    </motion.button>
  );
}

function Metric({
  icon: Icon,
  n,
  noun,
  muted,
}: {
  icon: typeof BookMarked;
  n: number;
  noun: string;
  muted: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", muted && "opacity-40")}>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none tnum">{n.toLocaleString()}</p>
        <p className="truncate text-[0.7rem] text-muted-foreground">
          {noun}
          {n === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
