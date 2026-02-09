"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ChatFeed } from "./chatFeed";
import { ChatForm } from "./chatForm";
import { api } from "@/convex/_generated/api";

interface RoomChatClientProps {
  room: string;
}

const RoomChatClient = ({ room }: RoomChatClientProps) => {
  const [username, setUsername] = useState("");
  const [input, setInput] = useState("");

  const upsertUser = useMutation(api.chats.upsertUser);

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const name = input.trim();
      setUsername(name);
      upsertUser({ name });
    }
  };

  return (
    <main className="min-h-screen w-full bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      {username ? (
        <div className="mx-auto flex w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow backdrop-blur">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-300/80">ONLINE AS</div>
              <div className="text-lg font-bold text-white">{username}</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100">
              Room: <span className="text-indigo-200">{room}</span>
            </div>
          </header>

          <ChatFeed currentUser={username} room={room} />
          <ChatForm username={username} room={room} />
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <form
            onSubmit={handleEnter}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur"
          >
          <h2 className="text-xl font-bold text-white">Choose your username</h2>
          <p className="mt-1 text-sm text-slate-300">
            Joining room <span className="font-semibold text-indigo-200">{room}</span>
          </p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Your name..."
            className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            autoFocus
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          >
            Enter
          </button>
          </form>
        </div>
      )}
    </main>
  );
};

export { RoomChatClient };
