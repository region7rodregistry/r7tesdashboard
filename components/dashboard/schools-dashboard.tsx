"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  MapPin,
  Building2,
  School,
  Library,
  Landmark,
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
import { SchoolDetail } from "./school-detail";
import { locationLabel, type School as SchoolType, type SchoolsOverview } from "@/lib/utpras-schools";

interface SchoolsDashboardProps {
  schools: SchoolType[];
  overview: SchoolsOverview;
}

type SortKey = "name" | "programs" | "expiring" | "expired";

const ALL = "__all__";
const PAGE_SIZE = 24;

// Mini status-pill palette (mirrors the KPI cards' validity colors).
const STATUS_PILLS = [
  { key: "valid", label: "valid", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { key: "expiring", label: "expiring", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { key: "expired", label: "expired", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
] as const;

const OVERVIEW_STATS = [
  { key: "schools", label: "Schools", icon: School, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
  { key: "programs", label: "Programs", icon: Library, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15" },
  { key: "publicSchools", label: "Public", icon: Landmark, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  { key: "privateSchools", label: "Private", icon: Building2, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
] as const;

export function SchoolsDashboard({ schools, overview }: SchoolsDashboardProps) {
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [province, setProvince] = React.useState("all");
  const [sector, setSector] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [page, setPage] = React.useState(1);

  const deferredSearch = React.useDeferredValue(search);

  const provinces = React.useMemo(
    () =>
      Array.from(new Set(schools.flatMap((s) => s.provinces))).sort((a, b) => a.localeCompare(b)),
    [schools],
  );
  const sectors = React.useMemo(
    () =>
      Array.from(new Set(schools.flatMap((s) => s.sectors))).sort((a, b) => a.localeCompare(b)),
    [schools],
  );

  const filtered = React.useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const arr = schools.filter((s) => {
      if (province !== "all" && !s.provinces.includes(province)) return false;
      if (sector !== "all" && !s.sectors.includes(sector)) return false;
      if (q) {
        const hay = [s.name, s.municipalities.join(" "), s.provinces.join(" "), s.address, s.institution_head]
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
        case "expiring":
          return b.stats.expiring - a.stats.expiring || a.name.localeCompare(b.name);
        case "expired":
          return b.stats.expired - a.stats.expired || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
      }
    });
    return arr;
  }, [schools, province, sector, deferredSearch, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = React.useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, province, sector, sortKey]);

  const hasFilters = search !== "" || province !== "all" || sector !== "all";
  const resetFilters = () => {
    setSearch("");
    setProvince("all");
    setSector("all");
  };

  const selected = selectedKey ? schools.find((s) => s.key === selectedKey) ?? null : null;

  if (selected) {
    return (
      <SchoolDetail key={selected.key} school={selected} onBack={() => setSelectedKey(null)} />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Schools</h1>
        <p className="text-sm text-muted-foreground">
          Registered TVET institutions across Region VII — open a school to see its programs and
          validity KPIs.
        </p>
      </div>

      {/* Directory overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {OVERVIEW_STATS.map((s) => (
          <Card key={s.key} className="flex-row items-center gap-4 p-5">
            <div className={`flex size-12 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
              <s.icon className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tnum">{overview[s.key].toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="gap-3 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school, head, municipality, address…"
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
              <SelectTrigger className="lg:w-48" aria-label="Sort schools">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A–Z)</SelectItem>
                <SelectItem value="programs">Most programs</SelectItem>
                <SelectItem value="expiring">Most expiring</SelectItem>
                <SelectItem value="expired">Most expired</SelectItem>
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

      {/* School cards */}
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
  school: SchoolType;
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
  // Programs with no/unparseable expiry aren't counted in valid/expiring/expired,
  // so surface them too — otherwise the pills wouldn't reconcile with the total.
  const noDate =
    school.programs.length - (school.stats.valid + school.stats.expiring + school.stats.expired);

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
      <Card className="h-full gap-4 p-5 transition-all hover:ring-2 hover:ring-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{school.name}</h3>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {school.institution_type && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Building2 className="size-3" /> {school.institution_type}
            </Badge>
          )}
          {school.classification && (
            <Badge variant="outline" className="text-[11px]">
              {school.classification}
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

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <div>
            <p className="text-2xl font-bold leading-none tnum">{school.programs.length}</p>
            <p className="text-xs text-muted-foreground">
              {school.programs.length === 1 ? "program" : "programs"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {STATUS_PILLS.map((p) => {
              const n = school.stats[p.key];
              if (!n) return null;
              return (
                <span key={p.key} className={`inline-flex items-center gap-1 text-xs font-medium ${p.text}`}>
                  <span className={`size-1.5 rounded-full ${p.dot}`} />
                  {n.toLocaleString()} {p.label}
                </span>
              );
            })}
            {noDate > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                {noDate.toLocaleString()} no date
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.button>
  );
}
