import { Suspense } from "react";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Sign in — Regional Dashboard VII",
};

// Auth state is per-request — never cache this route.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Belt-and-suspenders: middleware already redirects authed users away, but
  // re-check here so a stale cached render can't ever show the login form to a
  // signed-in admin.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) redirect("/");

  return (
    <main className="bg-tesda-header relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft brand glows behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(56,121,255,0.35), transparent 70%), radial-gradient(40% 40% at 85% 90%, rgba(10,36,99,0.6), transparent 70%)",
        }}
      />

      <div className="absolute top-4 right-4">
        <ThemeToggle className="text-sky-100 hover:bg-white/10 hover:text-white" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Login card — logo + title live inside it */}
        <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-black/10 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-secondary ring-1 ring-border">
              <Image
                src="/icons/tlogo.png"
                alt="TESDA — Technical Education and Skills Development Authority"
                width={72}
                height={72}
                className="size-14 object-contain"
                priority
              />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Regional Dashboard VII</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              TESDA Region VII · Central Visayas
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-sky-200/80">
          <ShieldCheck className="size-3.5" />
          Authorized personnel only · National TVET Trainer&rsquo;s Certificate
        </p>
      </div>
    </main>
  );
}
