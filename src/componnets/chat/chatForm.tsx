"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ChatFormProps {
  token: string;
  room: string;
}

type ChatFormValues = {
  message: string;
};

type ContextType = "file" | "snippet" | "task";

const ChatForm = ({ token, room }: ChatFormProps) => {
  const addMessage = useMutation(api.chats.addChat);

  const [contextOpen, setContextOpen] = useState(false);
  const [contextType, setContextType] = useState<ContextType>("file");
  const [contextData, setContextData] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<ChatFormValues>({ defaultValues: { message: "" } });

  const message = watch("message");
  const canSend = useMemo(() => Boolean((message ?? "").trim()), [message]);

  const onSubmit = async (data: ChatFormValues) => {
    const trimmed = (data.message ?? "").trim();
    if (!trimmed) return;

    const cData = contextData.trim();
    await addMessage({
      token,
      room,
      message: trimmed,
      contextType: cData ? contextType : undefined,
      contextData: cData ? cData : undefined,
    });

    reset({ message: "" });
    setContextData("");
    setContextOpen(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 flex w-full flex-col gap-2 rounded-2xl border theme-panel p-2 shadow backdrop-blur sm:flex-row sm:items-end"
      autoComplete="off"
    >
      <div className="flex-1">
        {contextData.trim() ? (
          <div className="mb-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold theme-chip">
            <span className="theme-faint">[{contextType}:</span>
            <span className="max-w-[18rem] truncate">{contextData.trim()}</span>
            <span className="theme-faint">]</span>
            <button
              type="button"
              onClick={() => setContextData("")}
              className="rounded-lg border px-2 py-1 text-[10px] font-semibold theme-chip"
              title="Remove context"
            >
              Clear
            </button>
          </div>
        ) : null}

        {contextOpen ? (
          <div className="mb-2 flex flex-col gap-2 rounded-2xl border theme-panel-strong p-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-semibold tracking-widest theme-faint">
                ATTACH CONTEXT
              </div>
              <select
                value={contextType}
                onChange={(e) => setContextType(e.target.value as ContextType)}
                className="rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none theme-input"
              >
                <option value="file">file</option>
                <option value="snippet">snippet</option>
                <option value="task">task</option>
              </select>
              <button
                type="button"
                onClick={() => setContextOpen(false)}
                className="ml-auto rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Close
              </button>
            </div>
            <textarea
              value={contextData}
              onChange={(e) => setContextData(e.target.value)}
              placeholder={
                contextType === "file"
                  ? "e.g. auth.ts"
                  : contextType === "task"
                    ? "e.g. PROJ-123"
                    : "Paste snippet…"
              }
              rows={contextType === "snippet" ? 4 : 2}
              className="w-full resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
            />
          </div>
        ) : null}

        <input
          type="text"
          placeholder="Type your message…"
          {...register("message")}
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
        />
      </div>

      <button
        type="button"
        onClick={() => setContextOpen((v) => !v)}
        className="w-full rounded-xl border px-3 py-3 text-xs font-semibold shadow focus:outline-none focus:ring-2 focus:ring-cyan-400/20 theme-chip sm:w-auto"
      >
        Attach
      </button>
      <button
        type="submit"
        disabled={!canSend || isSubmitting}
        className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] sm:w-auto"
      >
        {isSubmitting ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

export { ChatForm };
