"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, LayoutDashboard, LogOut, Mailbox, Settings2, UsersRound } from "lucide-react";
import { BrandLogo } from "@/src/components/app/brand-logo";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { ThemeToggle } from "@/src/features/theme/ThemeToggle";
import { Avatar } from "@/src/features/ui/Avatar";
import { cn } from "@/src/lib/utils";

interface AppNavProps {
  pathname: string;
}

const primaryNavItems = [
  { label: "Inbox", href: "/chat", icon: Mailbox },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Account", href: "/profile", icon: CircleUserRound },
];

const profileMenuItems = [
  { label: "Dashboard", href: "/chat", icon: LayoutDashboard },
  { label: "Settings", href: "/settings", icon: Settings2 },
  { label: "Profile", href: "/profile", icon: CircleUserRound },
];

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/chat") {
    return pathname.startsWith("/chat");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

function MobileIconLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200 ease-out",
            active
              ? "border-[color:var(--brand-border)] bg-[color:var(--surface-3)] text-[color:var(--accent-text)]"
              : "border-[color:var(--border-1)] bg-[color:var(--surface-2)] text-[color:var(--text-2)] hover:-translate-y-0.5 hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-1)]"
          )}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function AppNav({ pathname }: AppNavProps) {
  const router = useRouter();
  const auth = useChatAuth();
  const profileName = auth.name ?? "You";
  const profileImage = auth.me?.profilePictureUrl;

  return (
    <TooltipProvider delayDuration={120}>
      <header className="sticky top-0 z-40 border-b border-[color:var(--border-1)] bg-[color:var(--header-bg)] shadow-[var(--header-shadow)] backdrop-blur-xl">
        <div className="mx-auto flex w-full min-w-0 max-w-[1520px] items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link href="/chat" className="min-w-0">
            <BrandLogo tagline="Team messaging" />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {primaryNavItems.map((item) => {
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
                      ? "border-[color:var(--brand-border)] bg-[color:var(--surface-3)] text-[color:var(--accent-text)] shadow-[0_12px_28px_-20px_rgba(6,95,70,0.28)]"
                      : "border-[color:var(--border-1)] bg-[color:var(--surface-2)] text-[color:var(--text-2)] hover:-translate-y-0.5 hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-1)]"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex">
              <Badge variant="outline">Realtime workspace</Badge>
            </div>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {primaryNavItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                return (
                  <MobileIconLink key={item.href} href={item.href} label={item.label} active={isActiveRoute(pathname, item.href)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </MobileIconLink>
                );
              })}
              <ThemeToggle compact className="sm:hidden" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-full px-2.5 sm:px-3">
                  <Avatar name={profileName} url={profileImage} size="sm" className="h-8 w-8 rounded-xl" />
                  <span className="hidden max-w-28 truncate text-sm sm:inline">{profileName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar name={profileName} url={profileImage} size="md" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[color:var(--text-1)]">{profileName}</div>
                      <div className="text-xs font-medium text-[color:var(--text-3)]">Quick access</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profileMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void (async () => {
                      await auth.logout();
                      router.push("/");
                    })();
                  }}
                  className="text-[color:var(--danger-text)] focus:bg-[color:var(--danger-soft)] focus:text-[color:var(--danger-text)]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
