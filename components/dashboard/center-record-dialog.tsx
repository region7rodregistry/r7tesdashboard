"use client";

import Image from "next/image";
import {
  MapPin, BadgeCheck, Building2, Phone, Calendar, Barcode, ClipboardCheck, User, Navigation,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { PtcacsRecord } from "@/lib/ptcacs-columns";
import {
  field, formatDate, validityStatus, STATUS_META, daysUntilExpiry,
} from "@/lib/ptcacs";
import { InfoItem, Section } from "./record-info";
import { cn } from "@/lib/utils";

interface CenterRecordDialogProps {
  record: PtcacsRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CenterRecordDialog({ record, open, onOpenChange }: CenterRecordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">{record && <RecordBody record={record} />}</DialogContent>
    </Dialog>
  );
}

function RecordBody({ record }: { record: PtcacsRecord }) {
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
              <Building2 className="size-3.5" />
              Accredited Assessment Center
            </div>
            <DialogTitle className="mt-1.5 text-2xl leading-tight font-semibold">
              {field(record, "assessment_center") || "Unnamed Center"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sky-100/90">
              {field(record, "qualification_title") || "Qualification not specified"}
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
              {field(record, "valid_until") && (
                <Badge className="border-white/20 bg-white/10 text-white">
                  <Calendar className="size-3" /> Valid until {formatDate(field(record, "valid_until"))}
                </Badge>
              )}
              <Badge className="border-white/20 bg-white/10 text-white">
                <MapPin className="size-3" /> {field(record, "province") || "—"}
              </Badge>
              <Badge className="border-white/20 bg-white/10 font-mono text-white tnum">
                <Barcode className="size-3" />
                {field(record, "accreditation_number") || "No accreditation no."}
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
        <Tabs defaultValue="center">
          <TabsList className="w-full">
            <TabsTrigger value="center">
              <Building2 className="size-3.5" /> Center
            </TabsTrigger>
            <TabsTrigger value="accreditation">
              <ClipboardCheck className="size-3.5" /> Accreditation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="center">
            <Section>
              <InfoItem label="Assessment Center" value={field(record, "assessment_center")} className="sm:col-span-2" />
              <InfoItem
                label="Center Manager"
                value={
                  field(record, "center_manager") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" />
                      {field(record, "center_manager")}
                    </span>
                  ) : ""
                }
              />
              <InfoItem
                label="Tel. No."
                value={
                  field(record, "tel_no") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      {field(record, "tel_no")}
                    </span>
                  ) : ""
                }
                mono
              />
              <InfoItem label="Address" value={field(record, "address")} className="sm:col-span-2" />
              <InfoItem label="Region" value={field(record, "region")} />
              <InfoItem label="Province" value={field(record, "province")} />
              <InfoItem
                label="Latitude"
                value={
                  field(record, "latitude") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Navigation className="size-3.5 text-muted-foreground" />
                      {field(record, "latitude")}
                    </span>
                  ) : ""
                }
                mono
              />
              <InfoItem label="Longitude" value={field(record, "longitude")} mono />
            </Section>
          </TabsContent>

          <TabsContent value="accreditation">
            <Section>
              <InfoItem label="Qualification Title" value={field(record, "qualification_title")} className="sm:col-span-2" />
              <InfoItem label="Sector" value={field(record, "sector")} />
              <InfoItem label="Accreditation Number" value={field(record, "accreditation_number")} mono />
              <InfoItem
                label="Date Accredited"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {formatDate(field(record, "date_accredited"))}
                  </span>
                }
              />
              <InfoItem label="Valid Until" value={formatDate(field(record, "valid_until"))} />
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
