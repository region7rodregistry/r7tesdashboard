"use client";

import * as React from "react";
import Image from "next/image";
import {
  MapPin, FileCheck, BadgeCheck, Building2, Mail, Phone, Calendar, Hash, Barcode, GraduationCap, ClipboardCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { UtprasRecord } from "@/lib/utpras-columns";
import {
  field, formatDate, validityStatus, STATUS_META, daysUntilExpiry,
} from "@/lib/utpras";
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
  return <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>;
}

interface UtprasRecordDialogProps {
  record: UtprasRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UtprasRecordDialog({ record, open, onOpenChange }: UtprasRecordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">{record && <RecordBody record={record} />}</DialogContent>
    </Dialog>
  );
}

function RecordBody({ record }: { record: UtprasRecord }) {
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
              <FileCheck className="size-3.5" />
              UTPRAS Registered Program
            </div>
            <DialogTitle className="mt-1.5 text-2xl leading-tight font-semibold">
              {field(record, "institution_name") || "Unnamed Institution"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sky-100/90">
              {field(record, "course_program") || "Program not specified"}
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
              {field(record, "expiration_date") && (
                <Badge className="border-white/20 bg-white/10 text-white">
                  <Calendar className="size-3" /> Expires {formatDate(field(record, "expiration_date"))}
                </Badge>
              )}
              <Badge className="border-white/20 bg-white/10 text-white">
                <MapPin className="size-3" /> {field(record, "province") || "—"}
              </Badge>
              <Badge className="border-white/20 bg-white/10 font-mono text-white tnum">
                <Barcode className="size-3" />
                {field(record, "program_reg_no") || "No reg. no."}
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
        <Tabs defaultValue="institution">
          <TabsList className="w-full">
            <TabsTrigger value="institution">
              <Building2 className="size-3.5" /> Institution
            </TabsTrigger>
            <TabsTrigger value="program">
              <GraduationCap className="size-3.5" /> Program
            </TabsTrigger>
            <TabsTrigger value="assessment">
              <ClipboardCheck className="size-3.5" /> Trainer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institution">
            <Section>
              <InfoItem label="Name of Institution" value={field(record, "institution_name")} className="sm:col-span-2" />
              <InfoItem label="Formerly Name of TVI" value={field(record, "formerly_name")} />
              <InfoItem label="Head of Institution" value={field(record, "institution_head")} />
              <InfoItem label="Type of Institution" value={field(record, "institution_type")} />
              <InfoItem label="Classification" value={field(record, "classification")} />
              <InfoItem label="Unique Institution ID (UIID)" value={field(record, "unique_institution_id")} mono />
              <InfoItem label="Status" value={field(record, "status")} />
              <InfoItem label="Region" value={field(record, "region")} />
              <InfoItem label="Province" value={field(record, "province")} />
              <InfoItem label="Congressional District" value={field(record, "congressional_district")} />
              <InfoItem label="Municipality" value={field(record, "municipality")} />
              <InfoItem label="Municipality Class" value={field(record, "municipality_class")} />
              <InfoItem label="Address" value={field(record, "address")} className="sm:col-span-2" />
              <InfoItem
                label="Contact Number"
                value={
                  field(record, "tel_no") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      {field(record, "tel_no")}
                    </span>
                  ) : ""
                }
              />
              <InfoItem
                label="Email Address"
                value={
                  field(record, "email") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {field(record, "email")}
                    </span>
                  ) : ""
                }
              />
              <InfoItem label="Latitude" value={field(record, "latitude")} mono />
              <InfoItem label="Longitude" value={field(record, "longitude")} mono />
            </Section>
          </TabsContent>

          <TabsContent value="program">
            <Section>
              <InfoItem label="Qualification / Registered Program" value={field(record, "course_program")} className="sm:col-span-2" />
              <InfoItem label="Sector" value={field(record, "sector")} />
              <InfoItem label="PQF Level" value={field(record, "pqf_level")} />
              <InfoItem label="Duration" value={field(record, "duration")} />
              <InfoItem label="Status" value={field(record, "status")} />
              <InfoItem label="Program Registration No." value={field(record, "program_reg_no")} mono className="sm:col-span-2" />
              <InfoItem
                label="Date Issued"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {formatDate(field(record, "date_issued"))}
                  </span>
                }
              />
              <InfoItem label="Expiration Date" value={formatDate(field(record, "expiration_date"))} />
              <InfoItem label="Original Date of Registration" value={formatDate(field(record, "original_date_of_registration"))} className="sm:col-span-2" />
            </Section>
          </TabsContent>

          <TabsContent value="assessment">
            <Section>
              <InfoItem label="Trainer" value={field(record, "trainer")} className="sm:col-span-2" />
              <InfoItem label="NTTC" value={field(record, "nttc")} mono className="sm:col-span-2" />
              <InfoItem label="NTTC Expiration Date" value={formatDate(field(record, "nttc_expiration_date"))} />
              <InfoItem label="Date Conducted" value={formatDate(field(record, "date_conducted"))} />
              <InfoItem label="Result" value={field(record, "result")} />
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
