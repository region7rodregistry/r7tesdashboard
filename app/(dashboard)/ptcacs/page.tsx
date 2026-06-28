import { redirect } from "next/navigation";

export const metadata = { title: "PTCACs — Regional Dashboard VII" };

// PTCACs lands on the Assessment Centers tab.
export default function PtcacsPage() {
  redirect("/ptcacs/centers");
}
