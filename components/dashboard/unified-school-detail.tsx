"use client";

import * as React from "react";
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Layers,
  BookMarked,
  ClipboardCheck,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtprasStatCards } from "./utpras-stat-cards";
import { UtprasTable, type SortKey as USortKey, type SortState as USortState } from "./utpras-table";
import { UtprasRecordDialog } from "./utpras-record-dialog";
import { PtcacsStatCards } from "./ptcacs-stat-cards";
import { CentersTable, type SortKey as CSortKey, type SortState as CSortState } from "./centers-table";
import { CenterRecordDialog } from "./center-record-dialog";
import { PaginationBar } from "./pagination-bar";
import { field as uField, validityStatus as uStatus, computeStats as uStats } from "@/lib/utpras";
import { field as cField, validityStatus as cStatus, computeStats as cStats } from "@/lib/ptcacs";
import type { UtprasRecord } from "@/lib/utpras-columns";
import type { PtcacsRecord } from "@/lib/ptcacs-columns";
import { isMultiSite, locationLabel, type UnifiedSchool } from "@/lib/schools-unified";

interface UnifiedSchoolDetailProps {
  school: UnifiedSchool;
  onBack: () => void;
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm leading-snug text-foreground">{children || "—"}</p>
      </div>
    </div>
  );
}

const PAGE = 15;

export function UnifiedSchoolDetail({ school, onBack }: UnifiedSchoolDetailProps) {
  const location = locationLabel(school);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft className="size-4" /> All schools
      </Button>

      {/* School identity */}
      <Card className="gap-5 p-6">
        <div>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
            {school.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {school.inUtpras && (
              <Badge variant="secondary" className="gap-1">
                <BookMarked className="size-3" /> UTPRAS · {school.programs.length} program
                {school.programs.length === 1 ? "" : "s"}
              </Badge>
            )}
            {school.inPtcac && (
              <Badge variant="secondary" className="gap-1">
                <ClipboardCheck className="size-3" /> Assessment Center · {school.accreditations.length}{" "}
                accreditation{school.accreditations.length === 1 ? "" : "s"}
              </Badge>
            )}
            {school.institution_type && <Badge variant="outline">{school.institution_type}</Badge>}
            {school.classification && <Badge variant="outline">{school.classification}</Badge>}
            {location && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <MapPin className="size-3" /> {location}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={User} label="Head / Manager">
            {school.head}
          </InfoItem>
          <InfoItem icon={Layers} label="Sectors">
            {school.sectors.length ? school.sectors.join(", ") : ""}
          </InfoItem>
          <InfoItem icon={MapPin} label={isMultiSite(school) ? "Provinces" : "Address"}>
            {isMultiSite(school) ? school.provinces.join(", ") : school.address}
          </InfoItem>
          <InfoItem icon={Phone} label="Contact Number">
            <span className="font-mono text-[0.82rem] tnum">{school.tel_no || "—"}</span>
          </InfoItem>
          <InfoItem icon={Mail} label="Email Address">
            <span className="break-all">{school.email || "—"}</span>
          </InfoItem>
        </div>
      </Card>

      {school.inUtpras && <ProgramsSection programs={school.programs} />}
      {school.inPtcac && <AccreditationsSection accreditations={school.accreditations} />}
    </div>
  );
}

// ── UTPRAS programs ─────────────────────────────────────────────────────────
function ProgramsSection({ programs }: { programs: UtprasRecord[] }) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "valid" | "expiring" | "expired" | "unknown">("all");
  const [sort, setSort] = React.useState<USortState>({ key: "course_program", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<UtprasRecord | null>(null);
  const [open, setOpen] = React.useState(false);
  const q = React.useDeferredValue(search).trim().toLowerCase();

  const stats = React.useMemo(() => uStats(programs), [programs]);
  const filtered = React.useMemo(() => {
    const rows = programs.filter((r) => {
      if (status !== "all" && uStatus(r) !== status) return false;
      if (q) {
        const hay = ["course_program", "program_reg_no", "sector", "trainer", "duration"]
          .map((k) => uField(r, k))
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) => uField(a, sort.key).localeCompare(uField(b, sort.key), "en", { numeric: true }) * mult,
    );
  }, [programs, status, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, totalPages);
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE);
  React.useEffect(() => setPage(1), [status, q, sort]);

  const onSort = (key: USortKey) =>
    setSort((p) => (p.key === key ? { key, dir: p.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <BookMarked className="size-4 text-primary" /> Registered Programs
        <span className="text-sm font-normal text-muted-foreground">· UTPRAS</span>
      </h3>
      <UtprasStatCards
        stats={stats}
        activeStatus={status}
        onSelect={(s) => setStatus((prev) => (s !== "all" && prev === s ? "all" : s))}
      />
      <SearchInput value={search} onChange={setSearch} placeholder="Search this school's programs…" />
      <UtprasTable
        rows={rows}
        sort={sort}
        onSort={onSort}
        onView={(r) => {
          setSelected(r);
          setOpen(true);
        }}
      />
      <PaginationBar page={cur} totalPages={totalPages} onPage={setPage} />
      <UtprasRecordDialog record={selected} open={open} onOpenChange={setOpen} />
    </section>
  );
}

// ── PTCAC assessment-center accreditations ──────────────────────────────────
function AccreditationsSection({ accreditations }: { accreditations: PtcacsRecord[] }) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "valid" | "expiring" | "expired" | "unknown">("all");
  const [sort, setSort] = React.useState<CSortState>({ key: "qualification_title", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<PtcacsRecord | null>(null);
  const [open, setOpen] = React.useState(false);
  const q = React.useDeferredValue(search).trim().toLowerCase();

  const stats = React.useMemo(() => cStats(accreditations, "assessment_center"), [accreditations]);
  const filtered = React.useMemo(() => {
    const rows = accreditations.filter((r) => {
      if (status !== "all" && cStatus(r) !== status) return false;
      if (q) {
        const hay = ["qualification_title", "accreditation_number", "sector", "center_manager", "address"]
          .map((k) => cField(r, k))
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) => cField(a, sort.key).localeCompare(cField(b, sort.key), "en", { numeric: true }) * mult,
    );
  }, [accreditations, status, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, totalPages);
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE);
  React.useEffect(() => setPage(1), [status, q, sort]);

  const onSort = (key: CSortKey) =>
    setSort((p) => (p.key === key ? { key, dir: p.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <ClipboardCheck className="size-4 text-primary" /> Assessment Center Accreditations
        <span className="text-sm font-normal text-muted-foreground">· PTCACs</span>
      </h3>
      <PtcacsStatCards
        stats={stats}
        totalLabel="Total Accreditations"
        totalIcon={ClipboardCheck}
        activeStatus={status}
        onSelect={(s) => setStatus((prev) => (s !== "all" && prev === s ? "all" : s))}
      />
      <SearchInput value={search} onChange={setSearch} placeholder="Search this center's accreditations…" />
      <CentersTable
        rows={rows}
        sort={sort}
        onSort={onSort}
        onView={(r) => {
          setSelected(r);
          setOpen(true);
        }}
      />
      <PaginationBar page={cur} totalPages={totalPages} onPage={setPage} />
      <CenterRecordDialog record={selected} open={open} onOpenChange={setOpen} />
    </section>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}
