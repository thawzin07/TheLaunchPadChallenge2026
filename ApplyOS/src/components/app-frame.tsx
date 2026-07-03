import {
  BriefcaseBusiness,
  Gauge,
  ListChecks,
  MessageSquareText,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/applications", label: "Applications", icon: ListChecks },
  { href: "/interview", label: "Interview Prep", icon: MessageSquareText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppFrame({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-stone-950 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">ApplyOS</div>
              <div className="text-xs text-stone-500">Evidence-first applications</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Badge tone="green">Private</Badge>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="max-w-48 truncate text-xs text-stone-500">{user.email}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-stone-200 bg-white lg:border-b-0 lg:border-r">
          <nav className="flex gap-1 overflow-x-auto p-3 lg:grid lg:p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 px-4 py-5 lg:px-7 lg:py-7">{children}</main>
      </div>
    </div>
  );
}
