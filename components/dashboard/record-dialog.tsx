"use client";

import * as React from "react";
import Image from "next/image";
import {
  MapPin, Award, BadgeCheck, GraduationCap, Mail, Phone, Calendar, Hash,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { NttcRecord } from "@/lib/columns";
import {
  field, fullName, formatDate, validityStatus, STATUS_META, daysUntilExpiry,
} from "@/lib/nttc";
import { cn } from "@/lib/utils";

function InfoItem({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  const empty = value === "" || value === null || value === undefined || value === "—";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-sm leading-snug",
          empty ? "text-muted-foreground/60" : "text-foreground",
          mono && "font-mono text-[0.82rem] tnum",
        )}
      >
        {empty ? "—" : value}
      </span>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
  );
}

interface RecordDialogProps {
  record: NttcRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordDialog({ record, open, onOpenChange }: RecordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">{record && <RecordBody record={record} />}</DialogContent>
    </Dialog>
  );
}

function RecordBody({ record }: { record: NttcRecord }) {
  const status = validityStatus(record);
  const meta = STATUS_META[status];
  const days = daysUntilExpiry(record);

  return (
    <div className="flex max-h-[92vh] flex-col">
      {/* Certificate-style header */}
      <div className="bg-tesda-header relative overflow-hidden px-6 py-6 text-white">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-16 size-44 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-200">
              <Award className="size-3.5" />
              NTTC Holder Record
            </div>
            <DialogTitle className="mt-1.5 text-2xl leading-tight font-semibold">
              {fullName(record) || "Unnamed Record"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sky-100/90">
              {field(record, "R") || "Qualification not specified"}
            </DialogDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
                  status === "valid" && "bg-emerald-500",
                  status === "expiring" && "bg-amber-500",
                  status === "expired" && "bg-rose-500",
                  status === "unknown" && "bg-white/20",
                )}
              >
                <BadgeCheck className="size-3.5" />
                {meta.label}
                {days !== null && status !== "expired" && status !== "unknown" && (
                  <span className="opacity-80">· {days}d left</span>
                )}
              </span>
              {field(record, "AD") && (
                <Badge className="border-white/20 bg-white/10 text-white">
                  <Calendar className="size-3" /> Expires {formatDate(field(record, "AD"))}
                </Badge>
              )}
              <Badge className="border-white/20 bg-white/10 text-white">
                <MapPin className="size-3" /> {field(record, "B") || "—"}
              </Badge>
              <Badge className="border-white/20 bg-white/10 font-mono text-white tnum">
                <Hash className="size-3" />
                {field(record, "AE") || "No control no."}
              </Badge>
            </div>
          </div>
          <Image
            src="/icons/tlogo.png"
            alt="TESDA"
            width={96}
            height={96}
            className="size-16 shrink-0 object-contain drop-shadow-md sm:size-24"
            priority
          />
        </div>
      </div>

      {/* Tabbed body */}
      <div className="scroll-fancy overflow-y-auto px-6 pb-6 pt-4">
        <Tabs defaultValue="personal">
          <TabsList className="w-full">
            <TabsTrigger value="personal">
              <GraduationCap className="size-3.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="nc">NC</TabsTrigger>
            <TabsTrigger value="tm">TM</TabsTrigger>
            <TabsTrigger value="nttc">NTTC</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Section>
              <InfoItem label="Full Name" value={fullName(record)} />
              <InfoItem label="Sex" value={field(record, "H")} />
              <InfoItem label="Birthday" value={formatDate(field(record, "G"))} />
              <InfoItem label="Region" value={field(record, "A")} />
              <InfoItem label="Province" value={field(record, "B")} />
              <InfoItem
                label="Email"
                value={
                  field(record, "J") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {field(record, "J")}
                    </span>
                  ) : ""
                }
              />
              <InfoItem
                label="Contact Number"
                value={
                  field(record, "K") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      {field(record, "K")}
                    </span>
                  ) : ""
                }
                mono
              />
              <InfoItem label="Educational Attainment" value={field(record, "L")} />
              <InfoItem label="Complete Address" value={field(record, "I")} className="sm:col-span-2" />
              <InfoItem label="Training Institution / Company" value={field(record, "M")} className="sm:col-span-2" />
              <InfoItem label="Institution Type" value={field(record, "N")} />
              <InfoItem label="Sector" value={field(record, "Q")} />
              <InfoItem label="Years of Experience (Training)" value={field(record, "O")} />
              <InfoItem label="Years Practicing the Qualification" value={field(record, "P")} />
            </Section>
          </TabsContent>

          <TabsContent value="nc">
            <Section>
              <InfoItem label="Qualification" value={field(record, "R")} className="sm:col-span-2" />
              <InfoItem label="NC Certificate Number" value={field(record, "S")} mono />
              <InfoItem label="Sector" value={field(record, "Q")} />
              <InfoItem
                label="NC Date Issued"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {formatDate(field(record, "T"))}
                  </span>
                }
              />
              <InfoItem label="NC Expiration Date" value={formatDate(field(record, "U"))} />
            </Section>
          </TabsContent>

          <TabsContent value="tm">
            <Section>
              <InfoItem label="TM Certificate Number" value={field(record, "V")} mono className="sm:col-span-2" />
              <InfoItem label="TM Date Issued" value={formatDate(field(record, "W"))} />
              <InfoItem label="TM Expiration Date" value={formatDate(field(record, "X"))} />
              <InfoItem label="Assessor — Panel 1" value={field(record, "Y")} />
              <InfoItem label="Assessor — Panel 2" value={field(record, "Z")} />
              <InfoItem label="Assessor — Panel 3" value={field(record, "AA")} />
            </Section>
          </TabsContent>

          <TabsContent value="nttc">
            <Section>
              <InfoItem label="NTTC Certificate Number" value={field(record, "AB")} mono />
              <InfoItem label="Control Number (CLN-NTC)" value={field(record, "AE")} mono />
              <InfoItem label="NTTC Date Issued" value={formatDate(field(record, "AC"))} />
              <InfoItem label="NTTC Expiration (Validity)" value={formatDate(field(record, "AD"))} />
              <InfoItem label="New NTTC or Renewal" value={field(record, "AG")} />
              <InfoItem label="Type of Employment" value={field(record, "AH")} />
              <InfoItem label="Status of Employment" value={field(record, "AI")} />
              <InfoItem
                label="Month / Year Issued"
                value={[field(record, "AK"), field(record, "AL")].filter(Boolean).join(" ")}
              />
              <InfoItem
                label="NTTC Expiration (Same as NC)"
                value={field(record, "AJ") ? formatDate(field(record, "U")) : ""}
                className="sm:col-span-2"
              />
              <InfoItem label="Remarks" value={field(record, "AF")} className="sm:col-span-2" />
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
