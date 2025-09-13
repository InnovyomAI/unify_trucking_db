"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xl md:text-2xl font-semibold tracking-tight text-slate-900", className)}>
      {children}
    </h2>
  );
}

export function HelpText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-slate-600", className)}>
      {children}
    </p>
  );
}

export function Masked({ length = 6, className }: { length?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600", className)}>
      {"\u2022".repeat(Math.max(1, length))}
    </span>
  );
}

export const stepsMeta: { title: string; help: string }[] = [
  { title: "License", help: "Jurisdiction and license number" },
  { title: "Identity", help: "Legal name and contact" },
  { title: "Address", help: "Mailing address" },
  { title: "Documents", help: "Upload & review documents" },
  { title: "History & Language", help: "Driving history and language" },
  { title: "Consent", help: "Agree and sign" },
];

