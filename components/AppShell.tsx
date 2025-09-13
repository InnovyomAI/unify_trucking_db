"use client";

import { ReactNode } from "react";
import { GlobalHeader } from "@/components/header/GlobalHeader";
import { TrustBanner } from "@/components/TrustBanner";
import { SiteFooter } from "@/components/footer/SiteFooter";

export function AppShell({
  children,
  showTrustBanner = true,
}: {
  children: ReactNode;
  showTrustBanner?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      {showTrustBanner && <TrustBanner />}
      <main className="flex-1 container-xl py-8 md:py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}

