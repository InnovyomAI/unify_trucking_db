import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IdCard, Scan, Settings } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Role = "driver" | "verifier" | "admin";

const roleConfig: Record<
  Role,
  { icon: ComponentType<SVGProps<SVGSVGElement>>; href: string; label: string }
> = {
  driver: { icon: IdCard, href: "/driver/enroll", label: "Driver" },
  verifier: { icon: Scan, href: "/verify/login", label: "Verifier" },
  admin: { icon: Settings, href: "/admin/login", label: "Admin" },
};

export function RoleCard({
  role,
  title,
  description,
}: {
  role: Role;
  title: string;
  description: string;
}) {
  const { icon: Icon, href, label } = roleConfig[role];

  return (
    <Card className="transition-all duration-150 ease-out hover:shadow-soft hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100" aria-hidden>
            <Icon className="h-5 w-5 text-slate-700" />
          </span>
          <CardTitle className="text-slate-900">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-700 text-sm">{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild aria-label={`${label} call to action`}>
          <Link href={href}>Continue</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
