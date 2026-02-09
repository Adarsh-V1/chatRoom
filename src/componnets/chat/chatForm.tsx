"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ChatFormProps {
  username: string;
  room: string;
}

type ChatFormValues = {
  message: string;
};

const ChatForm = ({ username, room }: ChatFormProps) => {
  const addMessage = useMutation(api.chats.addChat);
  const { register, handleSubmit, reset } = useForm<ChatFormValues>();

  const onSubmit = async (data: ChatFormValues) => {
    await addMessage({ message: data.message, username, room });
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-2 shadow"
      autoComplete="off"
    >
      <input
        type="text"
        placeholder="Type your message..."
        {...register("message", { required: true })}
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      />
      <button
        type="submit"
        className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
      >
        Send
      </button>
    </form>
  );
};

export { ChatForm }
