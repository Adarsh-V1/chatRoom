"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserListSidebarProps {
  currentUser: string;
  onSelectUser: (user: string) => void;
}

const UserListSidebar = ({ currentUser, onSelectUser }: UserListSidebarProps) => {
  const users = useQuery(api.users.listUsersWithProfiles);

  const me = (users ?? []).find((u) => u.name === currentUser);

  const otherUsers = (users ?? []).filter((u) => u.name !== currentUser);

  return (
    <aside className="flex h-[calc(100vh-3rem)] w-full flex-col rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-white shadow backdrop-blur md:w-80">
      <div className="mb-3">
        <div className="text-xs font-semibold tracking-widest text-slate-300/80">PLAYERS</div>
        <div className="mt-1 text-sm text-slate-300">
          Click a name for direct chat.
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <div className="text-xs text-slate-400">You</div>
        <div className="mt-1 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
            {me?.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.profilePictureUrl}
                alt={currentUser}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-200">
                {currentUser.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">{currentUser}</div>
          </div>
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {otherUsers.length > 0 ? (
          otherUsers.map((user) => (
            <li
              key={user.name}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:bg-white/10 hover:ring-1 hover:ring-cyan-400/20"
              onClick={() => onSelectUser(user.name)}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
                  {user.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-200">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{user.name}</div>
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
            No other players yet.
          </li>
        )}
      </ul>
    </aside>
  );
};

export { UserListSidebar };
