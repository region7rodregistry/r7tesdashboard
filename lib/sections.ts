import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  FileCheck,
  Target,
  Cpu,
  type LucideIcon,
} from "lucide-react";

/**
 * Top-level sections of the Regional Dashboard VII. This is the single source
 * of truth for the sidebar nav AND the Overview module grid — add a section
 * here (and a page under app/(dashboard)/<href>) and it shows up in both.
 *
 * `available: false` renders a "Soon" badge and a Coming-Soon page; flip it to
 * true once the section has real data/dashboards wired up.
 */
export interface Section {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** One-line description shown on the Overview cards. */
  description: string;
  available: boolean;
}

export const SECTIONS: Section[] = [
  {
    key: "overview",
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "Regional snapshot across every TESDA Region VII unit.",
    available: true,
  },
  {
    key: "nttc",
    label: "NTTC",
    href: "/nttc",
    icon: GraduationCap,
    description: "National TVET Trainer’s Certificate holders registry.",
    available: true,
  },
  {
    key: "ptcacs",
    label: "PTCACs",
    href: "/ptcacs",
    icon: ClipboardCheck,
    description: "Competency assessment centers and accreditation records.",
    available: false,
  },
  {
    key: "utpras",
    label: "UTPRAS",
    href: "/utpras",
    icon: FileCheck,
    description: "Registered & accredited TVET programs.",
    available: true,
  },
  {
    key: "planning",
    label: "Planning",
    href: "/planning",
    icon: Target,
    description: "Targets, accomplishments, and regional reports.",
    available: false,
  },
  {
    key: "it",
    label: "I.T.",
    href: "/it",
    icon: Cpu,
    description: "Systems, assets, and technical support.",
    available: false,
  },
];

/** Look up a section by key (throws in dev if the key is wrong). */
export function getSection(key: string): Section {
  const section = SECTIONS.find((s) => s.key === key);
  if (!section) throw new Error(`Unknown section: ${key}`);
  return section;
}
