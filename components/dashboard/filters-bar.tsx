"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ValidityStatus } from "@/lib/nttc";

export interface FilterState {
  search: string;
  province: string;
  sector: string;
  status: ValidityStatus | "all";
}

interface FiltersBarProps {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset: () => void;
  provinces: string[];
  sectors: string[];
  total: number;
  filtered: number;
}

const ALL = "__all__";

export function FiltersBar({
  filters,
  onChange,
  onReset,
  provinces,
  sectors,
  total,
  filtered,
}: FiltersBarProps) {
  const hasFilters =
    filters.search !== "" ||
    filters.province !== "all" ||
    filters.sector !== "all" ||
    filters.status !== "all";

  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search name, certificate, control number, qualification…"
            className="pl-9"
            aria-label="Search records"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-auto">
          <Select
            value={filters.province === "all" ? ALL : filters.province}
            onValueChange={(v) => onChange({ province: v === ALL ? "all" : v })}
          >
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

          <Select
            value={filters.status === "all" ? ALL : filters.status}
            onValueChange={(v) => onChange({ status: v === ALL ? "all" : (v as ValidityStatus) })}
          >
            <SelectTrigger className="lg:w-40" aria-label="Filter by validity">
              <SelectValue placeholder="Validity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Validity</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="unknown">No Date</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sector === "all" ? ALL : filters.sector}
            onValueChange={(v) => onChange({ sector: v === ALL ? "all" : v })}
          >
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
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0">
            <X className="size-4" /> Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="size-3.5" />
        Showing <span className="font-semibold text-foreground tnum">{filtered.toLocaleString()}</span>
        of <span className="tnum">{total.toLocaleString()}</span> records
      </div>
    </Card>
  );
}
