"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/src/features/ui/Avatar";

interface UserListSidebarProps {
  currentUser: string;
  token: string;
  onSelectUser: (user: string) => void;
  selectedUser?: string | null;
  className?: string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

const MAX_REACTIVE_USERS = 80;
const DISPLAY_LIMIT = 140;

function SidebarSkeletonRows() {
  return (
    <ul className="app-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index} className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-[18px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-3 w-36 rounded-full" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const UserListSidebar = ({
  currentUser,
  token,
  onSelectUser,
  selectedUser,
  className,
  title,
  subtitle,
  searchPlaceholder,
  emptyLabel,
}: UserListSidebarProps) => {
  const [query, setQuery] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const users = useQuery(
    api.users.listUsersWithProfiles,
    token
      ? {
          token,
          limit: 260,
          search: query.trim() || undefined,
        }
      : "skip"
  );
  const priorityUsers = useQuery(api.priorities.getUserPriorities, { token });
  const setUserPriority = useMutation(api.priorities.setUserPriority);

  const me = (users ?? []).find((u) => u.name === currentUser);

  const otherUsers = (users ?? []).filter((u) => u.name !== currentUser);
  const filteredUsers = useMemo(() => otherUsers, [otherUsers]);

  const displayUsers = useMemo(() => filteredUsers.slice(0, DISPLAY_LIMIT), [filteredUsers]);
  const otherNames = useMemo(
    () => displayUsers.slice(0, MAX_REACTIVE_USERS).map((u) => u.name),
    [displayUsers]
  );
  const statuses = useQuery(api.presence.getUserStatuses, token ? { token, names: otherNames } : "skip");
  const unreadCounts = useQuery(api.unread.getUnreadCountsForUsers, token ? { token, otherNames } : "skip");

  const statusMap = new Map((statuses ?? []).map((status) => [status.name.toLowerCase(), status] as const));
  const unreadMap = new Map((unreadCounts ?? []).map((status) => [status.name.toLowerCase(), status.unreadCount] as const));

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const formatLastSeen = (ts: number | null | undefined) => {
    if (!ts) return "Unavailable";
    const diffMs = nowMs - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden p-4", className)}>
      <div className="mb-4 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">{title ?? "People"}</div>
        <div className="text-sm text-[color:var(--text-2)]">{subtitle ?? "Open a direct room or track who is online."}</div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-3)]" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder ?? "Search teammates"}
          className="pl-9"
        />
      </div>

      <Card className="mb-4 rounded-[24px] border-[color:var(--border-1)] bg-[color:var(--surface-4)] p-3 shadow-none">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">You</div>
        <div className="mt-3 flex items-center gap-3">
          {users === undefined ? (
            <>
              <Skeleton className="h-12 w-12 rounded-[18px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
            </>
          ) : (
            <>
              <Avatar name={currentUser} url={me?.profilePictureUrl} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">{currentUser}</div>
                <div className="text-sm text-[color:var(--text-3)]">Available across chat and calls</div>
              </div>
            </>
          )}
        </div>
      </Card>

      {users === undefined ? (
        <SidebarSkeletonRows />
      ) : (
        <ul className="app-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {displayUsers.length > 0 ? (
          displayUsers.map((user) => {
            const status = statusMap.get(user.name.toLowerCase());
            const unread = unreadMap.get(user.name.toLowerCase()) ?? 0;
            const prioritized = (priorityUsers ?? []).includes(user.name.toLowerCase());
            const selected = selectedUser === user.name;

            return (
              <li
                key={user.name}
                className={cn(
                  "rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)]",
                  selected && "border-[color:var(--brand-border)] bg-[color:var(--surface-3)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectUser(user.name)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-pressed={selected}
                  >
                    <Avatar name={user.name} url={user.profilePictureUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">{user.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-3)]">
                        <span className={cn("h-2 w-2 rounded-full", status?.online ? "bg-emerald-500" : "bg-slate-300")} aria-hidden="true" />
                        <span>{status?.online ? "Online" : `Last seen ${formatLastSeen(status?.lastSeenAt)}`}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    {unread > 0 ? <Badge variant="default">{unread}</Badge> : null}
                    <Button
                      variant={prioritized ? "default" : "outline"}
                      size="icon"
                      className={prioritized ? "h-9 w-9" : "h-9 w-9"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void setUserPriority({ token, otherName: user.name, priority: !prioritized });
                      }}
                      title="Toggle priority"
                      aria-label="Toggle priority"
                    >
                      <Star className="h-4 w-4" fill={prioritized ? "currentColor" : "none"} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })
          ) : (
            <li className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">
              {emptyLabel ?? "No matching people."}
            </li>
          )}
          {filteredUsers.length > displayUsers.length ? (
            <li className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-4 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--text-3)]">
              Showing first {displayUsers.length} results. Refine search to narrow down people.
            </li>
          ) : null}
        </ul>
      )}
    </Card>
  );
};

export { UserListSidebar };
