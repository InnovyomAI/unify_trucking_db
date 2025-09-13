"use client";

import { ShieldAlert } from "lucide-react";
import { TRUST } from "@/lib/copy";
import { usePathname } from "next/navigation";

export function TrustBanner() {
  const pathname = usePathname();
  const hide = pathname?.startsWith("/verify/session/") ?? false;
  if (hide) return null;
  return (
    <div className="w-full bg-slate-50 text-slate-700 border-b border-slate-200">
      <div className="container-xl py-2 text-sm flex items-center gap-2" role="status" aria-live="polite">
        <ShieldAlert className="h-4 w-4 text-accent" aria-hidden />
        <span>{TRUST.banner}</span>
      </div>
    </div>
  );
}
