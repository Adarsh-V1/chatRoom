"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserListSidebarProps {
  currentUser: string;
  token: string;
  onSelectUser: (user: string) => void;
  className?: string;
}

const UserListSidebar = ({ currentUser, token, onSelectUser, className }: UserListSidebarProps) => {
  const users = useQuery(api.users.listUsersWithProfiles);
  const priorityUsers = useQuery(api.priorities.getUserPriorities, { token });
  const setUserPriority = useMutation(api.priorities.setUserPriority);

  const otherNames = (users ?? []).filter((u) => u.name !== currentUser).map((u) => u.name);

  const statuses = useQuery(
    api.presence.getUserStatuses,
    token ? { token, names: otherNames } : "skip"
  );

  const unreadCounts = useQuery(
    api.unread.getUnreadCountsForUsers,
    token ? { token, otherNames } : "skip"
  );

  const me = (users ?? []).find((u) => u.name === currentUser);

  const otherUsers = (users ?? []).filter((u) => u.name !== currentUser);

  const statusMap = new Map(
    (statuses ?? []).map((s) => [s.name.toLowerCase(), s] as const)
  );

  const unreadMap = new Map(
    (unreadCounts ?? []).map((s) => [s.name.toLowerCase(), s.unreadCount] as const)
  );

  const formatLastSeen = (ts: number | null | undefined) => {
    if (!ts) return "";
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <aside
      className={
        "flex h-auto max-h-[45vh] w-full flex-col rounded-2xl border theme-panel p-4 shadow backdrop-blur md:h-[calc(100vh-3rem)] md:max-h-none md:w-80" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="mb-3">
        <div className="text-xs font-semibold tracking-widest theme-faint">PLAYERS</div>
        <div className="mt-1 text-sm theme-muted">
          Click a name for direct chat.
        </div>
      </div>

      <div className="mb-3 rounded-xl border px-3 py-2 theme-card">
        <div className="text-xs theme-faint">You</div>
        <div className="mt-1 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border theme-panel-strong">
            {me?.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.profilePictureUrl}
                alt={currentUser}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold theme-muted">
                {currentUser.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold theme-text">{currentUser}</div>
          </div>
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {otherUsers.length > 0 ? (
          otherUsers.map((user) => (
            <li
              key={user.name}
              className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition hover:ring-1 hover:ring-cyan-400/20 theme-chip"
              onClick={() => onSelectUser(user.name)}
            >
              {(() => {
                const status = statusMap.get(user.name.toLowerCase());
                const unread = unreadMap.get(user.name.toLowerCase()) ?? 0;

                return (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border theme-panel-strong">
                  {user.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold theme-muted">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{user.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold theme-faint">
                    <span
                      className={
                        "h-2 w-2 rounded-full " +
                        (status?.online ? "bg-emerald-400" : "bg-slate-400/60")
                      }
                      aria-hidden="true"
                    />
                    <span>
                      {status?.online
                        ? "Online"
                        : status
                          ? `Last seen ${formatLastSeen(status.lastSeenAt)}`
                          : "Last seen unknown"}
                    </span>
                  </div>
                </div>

                {unread > 0 ? (
                  <div className="rounded-full border px-2 py-0.5 text-[11px] font-semibold theme-chip">
                    {unread}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isOn = (priorityUsers ?? []).includes(user.name.toLowerCase());
                    void setUserPriority({ token, otherName: user.name, priority: !isOn });
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-bold theme-chip"
                  title="Toggle priority"
                  aria-label="Toggle priority"
                >
                  {(priorityUsers ?? []).includes(user.name.toLowerCase()) ? "★" : "☆"}
                </button>
              </div>
                );
              })()}
            </li>
          ))
        ) : (
          <li className="rounded-xl border px-3 py-3 text-sm theme-faint theme-card">
            No other players yet.
          </li>
        )}
      </ul>
    </aside>
  );
};

export { UserListSidebar };
