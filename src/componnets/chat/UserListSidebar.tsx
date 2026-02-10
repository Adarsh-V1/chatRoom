"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserListSidebarProps {
  currentUser: string;
  token: string;
  onSelectUser: (user: string) => void;
}

const UserListSidebar = ({ currentUser, token, onSelectUser }: UserListSidebarProps) => {
  const users = useQuery(api.users.listUsersWithProfiles);
  const priorityUsers = useQuery(api.priorities.getUserPriorities, { token });
  const setUserPriority = useMutation(api.priorities.setUserPriority);

  const me = (users ?? []).find((u) => u.name === currentUser);

  const otherUsers = (users ?? []).filter((u) => u.name !== currentUser);

  return (
    <aside className="flex h-auto max-h-[45vh] w-full flex-col rounded-2xl border theme-panel p-4 shadow backdrop-blur md:h-[calc(100vh-3rem)] md:max-h-none md:w-80">
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
                </div>

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
