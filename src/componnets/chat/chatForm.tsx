"use client";

import React, { useMemo } from "react";
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

const ChatForm = ({ token, room }: ChatFormProps) => {
  const addMessage = useMutation(api.chats.addChat);
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
    await addMessage({ token, room, message: trimmed });
    reset({ message: "" });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 flex w-full items-end gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-2 shadow backdrop-blur"
      autoComplete="off"
    >
      <input
        type="text"
        placeholder="Type your message…"
        {...register("message")}
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
      />
      <button
        type="submit"
        disabled={!canSend || isSubmitting}
        className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
        {isSubmitting ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

export { ChatForm };
