import Link from "next/link";
import { CircleUserRound, MessageSquareText, Settings2, UsersRound } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";

interface AppNavProps {
  pathname: string;
  showBottomNav: boolean;
}

const navItems = [
  { label: "Chat", href: "/chat", icon: MessageSquareText },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Settings", href: "/settings", icon: Settings2 },
  { label: "Profile", href: "/profile", icon: CircleUserRound },
];

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/chat") {
    return pathname.startsWith("/chat");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export function AppNav({ pathname, showBottomNav }: AppNavProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:var(--border-1)] bg-[color:rgba(227,236,247,0.78)] shadow-[0_18px_44px_-30px_rgba(15,23,42,0.34)] backdrop-blur-xl">
        <div className="flex w-full min-w-0 items-center justify-between gap-4 px-3 py-3 sm:px-4">
          <Link href="/chat" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/70 bg-linear-to-br from-cyan-100 via-sky-100 to-amber-100 text-sm font-semibold text-cyan-950 shadow-[0_16px_30px_-22px_rgba(8,145,178,0.52)]">
              TF
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Team chat</div>
              <div className="truncate text-lg font-semibold tracking-tight text-[color:var(--text-1)]">
                The <span className="font-(--font-fool) text-cyan-800">Fool&apos;s</span> Chat
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out",
                    active
                      ? "border-cyan-300/80 bg-cyan-100/82 text-cyan-950 shadow-[0_12px_28px_-20px_rgba(8,145,178,0.44)]"
                      : "border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.72)] text-[color:var(--text-2)] hover:-translate-y-0.5 hover:border-[color:var(--border-2)] hover:bg-[color:rgba(244,248,253,0.94)] hover:text-[color:var(--text-1)]"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex">
            <Badge variant="outline">Tinted light</Badge>
          </div>
        </div>
      </header>

      {showBottomNav ? (
        <nav className="fixed inset-x-0 bottom-3 z-40 px-3 md:hidden">
          <div className="grid w-full grid-cols-4 gap-2 rounded-[28px] border border-[color:var(--border-1)] bg-[color:rgba(228,237,248,0.92)] p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)] backdrop-blur-xl">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all duration-200 ease-out",
                    active
                      ? "bg-cyan-100/82 text-cyan-950 shadow-[0_8px_24px_-18px_rgba(8,145,178,0.4)]"
                      : "text-[color:var(--text-2)] hover:-translate-y-0.5 hover:bg-[color:rgba(240,245,252,0.94)] hover:text-[color:var(--text-1)]"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
}
