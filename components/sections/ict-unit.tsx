"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Cpu,
  Gauge,
  ShieldCheck,
  LifeBuoy,
  Lightbulb,
  GraduationCap,
  ExternalLink,
  Globe,
  BadgeCheck,
  Award,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// What the ICT Unit does — drawn from the unit's mandate (formerly buried in an
// "Info" modal on the old static page; surfaced here as a first-class grid).
const CAPABILITIES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Gauge,
    title: "Operational Efficiency",
    desc: "Robust information systems that streamline processes, cut manual workloads, and keep data accurate.",
  },
  {
    icon: ShieldCheck,
    title: "Data Management & Security",
    desc: "Trainee, trainer, and program data stored securely and retrieved efficiently — safeguarded against unauthorized access.",
  },
  {
    icon: LifeBuoy,
    title: "Support & Maintenance",
    desc: "Hands-on technical support and upkeep for the IT infrastructure across the Regional Operations Division.",
  },
  {
    icon: Lightbulb,
    title: "Innovation & Development",
    desc: "Cutting-edge, web-based projects that elevate TESDA's service delivery in Central Visayas.",
  },
  {
    icon: GraduationCap,
    title: "Training & Capacity Building",
    desc: "Upskilling TESDA staff on the new technologies and systems the unit rolls out.",
  },
];

interface Profile {
  background: string;
  responsibilities: string[];
  cellphone?: string;
}

interface CivilServiceRating {
  examination: string;
  level: string;
  venue: string;
  date: string;
  rating: number;
  ratingWords: string;
  subjects: { label: string; weight: number; score: number }[];
}

interface Member {
  name: string;
  role: string;
  photo: string;
  facebook?: string;
  portfolio?: string;
  lead?: boolean;
  profile?: Profile;
  civilService?: CivilServiceRating;
}

const TEAM: Member[] = [
  {
    name: "Gerard Randolf G. Tecson",
    role: "Information Technology Officer I",
    photo: "/icons/gerard.jpg",
    facebook: "https://www.facebook.com/teckiii",
    lead: true,
  },
  {
    name: "Aljohn Rosales",
    role: "Support Staff, ICT Unit",
    photo: "/icons/aljohn.jpg",
    facebook: "https://www.facebook.com/AljohnBoy",
  },
  {
    name: "Jan Kane T. Reroma",
    role: "Support Staff, ICT Unit",
    photo: "/icons/kane.jpg",
    portfolio: "https://kanereroma.vercel.app",
    profile: {
      background:
        "Joined TESDA Region VII on October 5, 2023. Instrumental in improving the NTTC process — building web-based systems that streamline workflows and boost efficiency.",
      responsibilities: [
        "Provides technical support for ICT infrastructure",
        "Maintains and troubleshoots computer systems",
        "Supports digital transformation initiatives",
        "Keeps the ICT Unit running efficiently",
      ],
      cellphone: "0920-519-6661",
    },
    civilService: {
      examination: "Career Service Examination — Pen and Paper Test",
      level: "Professional Level",
      venue: "Barrio Luz Elementary School, Archbishop Reyes Avenue, Cebu City",
      date: "August 11, 2024",
      rating: 85.51,
      ratingWords: "Eighty-Five and 51/100",
      subjects: [
        { label: "Verbal", weight: 30, score: 87.37 },
        { label: "Analytical", weight: 35, score: 84.0 },
        { label: "Numerical", weight: 30, score: 88.24 },
        { label: "General Info", weight: 5, score: 68.57 },
      ],
    },
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function IctUnit() {
  return (
    <div className="space-y-8">
      {/* Hero band — brand chrome, gives the unit its own identity */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="bg-tesda-header relative overflow-hidden rounded-2xl px-6 py-8 text-white shadow-lg ring-1 ring-black/10 sm:px-9 sm:py-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 60% at 88% 8%, rgba(56,121,255,0.45), transparent 70%), radial-gradient(40% 50% at 0% 100%, rgba(255,255,255,0.10), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur-sm">
              <Cpu className="size-7" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200">
                TESDA Region VII · Regional Operations Division
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">ICT Unit</h1>
              <p className="mt-1 max-w-xl text-sm text-sky-100/90">
                The people and systems behind Regional Dashboard VII — building tools, safeguarding
                data, and keeping the division online.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-50 ring-1 ring-white/15">
              {TEAM.length} members
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-50 ring-1 ring-white/15">
              {CAPABILITIES.length} core functions
            </span>
          </div>
        </div>
      </motion.header>

      {/* Capabilities */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">What we do</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 * i }}
            >
              <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:ring-foreground/20">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-border">
                  <c.icon className="size-5" />
                </div>
                <h3 className="font-semibold leading-snug">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">The team</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m, i) => (
            <MemberCard key={m.name} member={m} delay={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MemberCard({ member, delay }: { member: Member; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.08 * delay }}
    >
      <Card className="h-full items-center gap-4 p-6 text-center transition-all hover:shadow-md hover:ring-2 hover:ring-primary/25">
        <div className="relative size-24 overflow-hidden rounded-full ring-2 ring-border">
          <Image
            src={member.photo}
            alt={member.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold leading-tight">{member.name}</h3>
          <p className="text-sm text-muted-foreground">{member.role}</p>
        </div>

        {member.lead && (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            <BadgeCheck className="size-3.5 text-primary" /> Unit Head
          </Badge>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-1">
          {(member.profile || member.civilService) && <ProfileDialog member={member} />}
          {member.portfolio && (
            <Button asChild variant="outline" size="sm">
              <a href={member.portfolio} target="_blank" rel="noopener noreferrer">
                <Globe className="size-3.5" /> Portfolio
              </a>
            </Button>
          )}
          {member.facebook && (
            <Button asChild variant="outline" size="sm">
              <a href={member.facebook} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" /> Facebook
              </a>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function ProfileDialog({ member }: { member: Member }) {
  const hasOverview = Boolean(member.profile || member.portfolio);
  const hasCse = Boolean(member.civilService);
  // Land on whichever tab has content (Civil Service if that's all there is).
  const defaultTab = hasOverview ? "overview" : "cse";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">View profile</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 p-0">
        {/* Header band — pairs with the dialog's white close button */}
        <div className="bg-tesda-header flex items-center gap-4 px-6 py-5 text-white">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30">
            <Image src={member.photo} alt={member.name} fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-xl font-bold text-white">{member.name}</DialogTitle>
            <DialogDescription className="text-sky-100/90">{member.role}</DialogDescription>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="gap-0">
          <div className="border-b px-6 pt-4 pb-3">
            <TabsList className="w-full">
              {hasOverview && (
                <TabsTrigger value="overview">Overview</TabsTrigger>
              )}
              {hasCse && (
                <TabsTrigger value="cse">
                  <Award /> Civil Service
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-6">
            {hasOverview && (
              <TabsContent value="overview" className="mt-0 space-y-5">
                {member.profile?.background && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Background
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {member.profile.background}
                    </p>
                  </section>
                )}

                {member.profile?.responsibilities?.length ? (
                  <section className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Responsibilities
                    </h4>
                    <ul className="space-y-1.5">
                      {member.profile.responsibilities.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.portfolio && (
                      <Button asChild variant="outline" size="sm">
                        <a href={member.portfolio} target="_blank" rel="noopener noreferrer">
                          <Globe className="size-3.5" /> Portfolio
                        </a>
                      </Button>
                    )}
                    {member.facebook && (
                      <Button asChild variant="outline" size="sm">
                        <a href={member.facebook} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" /> Facebook
                        </a>
                      </Button>
                    )}
                    {member.profile?.cellphone && (
                      <Button asChild variant="outline" size="sm">
                        <a href={`tel:${member.profile.cellphone.replace(/[^0-9+]/g, "")}`}>
                          <Phone className="size-3.5" /> {member.profile.cellphone}
                        </a>
                      </Button>
                    )}
                  </div>
                </section>
              </TabsContent>
            )}

            {hasCse && member.civilService && (
              <TabsContent value="cse" className="mt-0">
                <CivilServiceRatingView data={member.civilService} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CivilServiceRatingView({ data }: { data: CivilServiceRating }) {
  return (
    <div className="space-y-5">
      {/* Passed banner with the headline rating */}
      <div className="relative overflow-hidden rounded-xl bg-emerald-500/10 p-5 ring-1 ring-emerald-500/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-emerald-500/15 blur-xl"
        />
        <div className="relative flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
            <Award className="size-6" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <CheckCircle2 className="size-3" /> Passed
            </span>
            <p className="mt-1 text-3xl font-bold leading-none tnum text-emerald-700 dark:text-emerald-300">
              {data.rating.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              General rating · {data.ratingWords}
            </p>
          </div>
        </div>
      </div>

      {/* Examination details */}
      <div className="space-y-1.5 text-sm">
        <p className="font-medium leading-snug">
          {data.examination}{" "}
          <span className="text-muted-foreground">({data.level})</span>
        </p>
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span>{data.venue}</span>
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>{data.date}</span>
        </p>
      </div>

      {/* Per-subject performance */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Performance by subject area
        </h4>
        <ul className="space-y-3">
          {data.subjects.map((s, i) => (
            <li key={s.label}>
              <div className="mb-1.5 flex items-baseline gap-2 text-sm">
                <span className="flex-1 truncate font-medium">{s.label}</span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {s.weight}%
                </Badge>
                <span className="w-14 text-right font-semibold tnum">{s.score.toFixed(2)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.score}%` }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.05 * i }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          Percentages indicate each area&apos;s weight in the general rating.
        </p>
      </section>
    </div>
  );
}
