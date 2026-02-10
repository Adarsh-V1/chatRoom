"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { Paperclip, Smile, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ChatFormProps {
  token: string;
  room: string;
}

type ChatFormValues = {
  message: string;
};

const ChatForm = ({ token, room }: ChatFormProps) => {
  const addMessage = useMutation(api.chats.addChat);
  const addFileChat = useMutation(api.chats.addFileChat);
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setTyping = useMutation(api.typing.setTyping);
  const settings = useQuery(api.settings.getMySettings, token ? { token } : "skip");

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<ChatFormValues>({ defaultValues: { message: "" } });

  const message = watch("message");
  const canSend = useMemo(
    () => Boolean((message ?? "").trim()) || Boolean(file),
    [message, file]
  );

  const emojiList = ["😀", "😂", "😍", "👍", "🙏", "🔥", "🎉", "✅", "💡", "🚀"];

  useEffect(() => {
    if (settings && settings.typingIndicator === false) {
      return;
    }
    if (!token || !room) return;

    const trimmed = (message ?? "").trim();
    if (!trimmed) {
      void setTyping({ token, room, isTyping: false });
      return;
    }

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2_000) {
      lastTypingSentRef.current = now;
      void setTyping({ token, room, isTyping: true });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      void setTyping({ token, room, isTyping: false });
    }, 3_000);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [message, room, setTyping, token, settings]);

  useEffect(() => {
    if (settings && settings.typingIndicator === false) {
      return;
    }
    return () => {
      if (!token || !room) return;
      void setTyping({ token, room, isTyping: false });
    };
  }, [room, setTyping, token, settings]);

  const onSubmit = async (data: ChatFormValues) => {
    const trimmed = (data.message ?? "").trim();
    if (!trimmed && !file) return;

    if (file) {
      setIsUploading(true);
      try {
        const uploadUrl = await generateUploadUrl({});
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!res.ok) throw new Error("Upload failed");
        const json = (await res.json()) as { storageId: string };

        await addFileChat({
          token,
          room,
          storageId: json.storageId as Id<"_storage">,
          fileName: file.name,
          fileType: file.type || undefined,
          fileSize: file.size,
          message: trimmed || undefined,
        });
      } finally {
        setIsUploading(false);
        setFile(null);
      }
    } else {
      await addMessage({
        token,
        room,
        message: trimmed,
      });
    }

    reset({ message: "" });
    setEmojiOpen(false);
    if (token && room && (!settings || settings.typingIndicator !== false)) {
      void setTyping({ token, room, isTyping: false });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative mt-3 flex w-full flex-nowrap items-center gap-2 rounded-2xl border theme-panel p-2 shadow backdrop-blur"
      autoComplete="off"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          setFile(next);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {file ? (
          <div className="inline-flex max-w-48 items-center gap-2 rounded-xl border px-2 py-1 text-[11px] font-semibold theme-chip">
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-md border p-1 text-[10px] font-semibold theme-chip"
              title="Remove file"
              aria-label="Remove file"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <input
          type="text"
          placeholder="Type your message…"
          {...register("message")}
          className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
          onBlur={() => {
            if (settings && settings.typingIndicator === false) return;
            if (!token || !room) return;
            void setTyping({ token, room, isTyping: false });
          }}
        />
      </div>

      {emojiOpen ? (
        <div className="absolute bottom-18 right-2 z-10 w-48 rounded-2xl border theme-panel-strong p-2 shadow-lg">
          <div className="grid grid-cols-5 gap-1">
            {emojiList.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setValue("message", `${message ?? ""}${emoji}`, { shouldDirty: true });
                  setEmojiOpen(false);
                }}
                className="rounded-lg border px-1 py-1 text-base theme-chip"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl border p-3 text-xs font-semibold shadow focus:outline-none focus:ring-2 focus:ring-cyan-400/20 theme-chip"
        aria-label="Attach file"
        title="Attach file"
      >
        <Paperclip className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setEmojiOpen((v) => !v)}
        className="rounded-xl border p-3 text-xs font-semibold shadow focus:outline-none focus:ring-2 focus:ring-cyan-400/20 theme-chip"
        aria-label="Insert emoji"
        title="Insert emoji"
      >
        <Smile className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="submit"
        disabled={!canSend || isSubmitting || isUploading}
        className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
        {isSubmitting || isUploading ? "Sending…" : "Send"}
      </button>
    </form>
  );
};

export { ChatForm };
