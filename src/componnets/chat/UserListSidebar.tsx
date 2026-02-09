"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserListSidebarProps {
  currentUser: string;
  onSelectUser: (user: string) => void;
}

const UserListSidebar = ({ currentUser, onSelectUser }: UserListSidebarProps) => {
  const usernames = useQuery(api.chats.listUsers);

  const otherUsers = (usernames ?? []).filter((u) => u !== currentUser);

  return (
    <aside className="flex w-full flex-col rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-white shadow backdrop-blur md:min-h-[calc(100vh-2rem)] md:w-72">
      <div className="mb-3">
        <div className="text-xs font-semibold tracking-widest text-slate-300/80">PLAYERS</div>
        <div className="mt-1 text-sm text-slate-300">
          Click a name for direct chat.
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <div className="text-xs text-slate-400">You</div>
        <div className="font-semibold text-white">{currentUser}</div>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        {otherUsers.length > 0 ? (
          otherUsers.map((user: string) => (
            <li
              key={user}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:bg-white/10"
              onClick={() => onSelectUser(user)}
            >
              {user}
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
