import { PtcacsHeader } from "@/components/dashboard/ptcacs-header";

/**
 * Persistent shell for the PTCACs module. Keeping the header here (instead of in
 * each page) means it survives Assessment Centers <-> Assessors navigation, so
 * the active-tab indicator can slide between tabs and only the body below swaps.
 */
export default function PtcacsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PtcacsHeader />
      {children}
    </>
  );
}
