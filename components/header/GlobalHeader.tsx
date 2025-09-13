"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Lock } from "lucide-react";
import { BRAND } from "@/lib/copy";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

type Variant = "driver" | "verify" | "admin";

export function GlobalHeader({ title, variant: variantProp }: { title?: string; variant?: Variant }) {
  const pathname = usePathname();
  let variant: Variant = variantProp ?? "driver";
  if (!variantProp) {
    if (pathname?.startsWith("/admin")) variant = "admin";
    else if (pathname?.startsWith("/v") || pathname?.startsWith("/verify")) variant = "verify";
    else if (pathname?.startsWith("/driver")) variant = "driver";
  }

  const headerClass =
    variant === "verify"
      ? "sticky top-0 z-40 w-full bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 border-b border-slate-200"
      : "sticky top-0 z-40 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200";

  return (
    <header className={headerClass}>
      <div className="container-xl h-16 flex items-center justify-between gap-4">
        {variant === "driver" ? (
          <Link href="/driver/enroll" className="flex items-center gap-2" aria-label="Go to driver portal">
            <Image src="/logo.svg" alt="Unify Trucking DB" width={28} height={28} />
            <span className="font-semibold tracking-tight text-slate-900 flex items-center gap-1">
              {BRAND.name}
              <ShieldCheck className="h-4 w-4 text-accent" aria-label="Trusted" />
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2" aria-label="Brand">
            <Image src="/logo.svg" alt="Unify Trucking DB" width={28} height={28} />
            <span className="font-semibold tracking-tight text-slate-900 flex items-center gap-1">
              {BRAND.name}
              <ShieldCheck className="h-4 w-4 text-accent" aria-label="Trusted" />
            </span>
          </div>
        )}

        {title ? (
          <div className="hidden md:block text-slate-700 font-medium" aria-live="polite">
            {title}
          </div>
        ) : (
          <div aria-hidden className="hidden md:block" />
        )}

        <div className="flex items-center">
          {variant === "verify" && (
            <Badge variant="secondary" aria-label="Secure Verification">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" aria-hidden /> Secure Verification
            </Badge>
          )}
          {variant === "admin" && (
            <Badge variant="secondary" aria-label="Admin Console">
              <Lock className="h-3.5 w-3.5 mr-1" aria-hidden /> Admin Console
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
