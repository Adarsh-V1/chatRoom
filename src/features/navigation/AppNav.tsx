import Link from "next/link";

interface AppNavProps {
  pathname: string;
  showBottomNav: boolean;
}

const navItems = [
  {
    label: "Chat",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 4v-4H7a3 3 0 0 1-3-3V6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Groups",
    href: "/groups",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M7 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm10 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM4 20a4 4 0 0 1 8 0m0 0h8a4 4 0 0 0-8 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm8.5 4a7.95 7.95 0 0 0-.14-1.5l2.1-1.64-2-3.46-2.52 1a8.3 8.3 0 0 0-2.6-1.5L12.5 2h-4l-.84 2.9a8.3 8.3 0 0 0-2.6 1.5l-2.52-1-2 3.46 2.1 1.64A7.95 7.95 0 0 0 3.5 12a7.95 7.95 0 0 0 .14 1.5l-2.1 1.64 2 3.46 2.52-1a8.3 8.3 0 0 0 2.6 1.5l.84 2.9h4l.84-2.9a8.3 8.3 0 0 0 2.6-1.5l2.52 1 2-3.46-2.1-1.64a7.95 7.95 0 0 0 .14-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
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
      <header className="sticky top-0 z-40 w-full border-b theme-border theme-panel backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/chat" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight theme-text">
              The
            </span>
            <span className="text-lg tracking-tight theme-accent font-(--font-fool)">
              Fool's
            </span>
            <span className="text-lg font-semibold tracking-tight theme-text">
              Chat
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                    isActive
                      ? "theme-panel-strong"
                      : "theme-chip opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {showBottomNav ? (
        <nav className="sticky top-[60px] z-30 w-full border-b theme-border theme-panel backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2">
            {navItems.map((item) => {
              const isActive = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] ${
                    isActive
                      ? "theme-panel-strong"
                      : "theme-chip opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.icon}
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
