import Link from "next/link";
import { TRUST } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-xl py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-slate-500">{TRUST.footer}</p>
        <nav className="flex items-center gap-4 text-xs text-slate-500" aria-label="Footer">
          <Link href="#" className="hover:underline focus-visible:underline" aria-label="Privacy policy">
            Privacy
          </Link>
          <Link href="#" className="hover:underline focus-visible:underline" aria-label="Terms of service">
            Terms
          </Link>
          <Link href="#" className="hover:underline focus-visible:underline" aria-label="Support">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}

