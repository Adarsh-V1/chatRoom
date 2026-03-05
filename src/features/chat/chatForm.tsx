"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { Paperclip, Smile, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
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
  const canSend = useMemo(() => Boolean((message ?? "").trim()) || Boolean(file), [message, file]);

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
        const uploadUrl = await generateUploadUrl({ token });
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
      await addMessage({ token, room, message: trimmed });
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
      className="relative mt-4 rounded-[28px] border border-[color:var(--border-1)] bg-[color:rgba(226,236,248,0.9)] p-3 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.36)] backdrop-blur-xl"
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

      {file ? (
        <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-2xl border border-[color:var(--border-1)] bg-[color:rgba(240,245,252,0.84)] px-3 py-2 text-sm text-[color:var(--text-2)]">
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          <span className="max-w-[16rem] truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="rounded-full border border-[color:var(--border-1)] bg-[color:rgba(246,249,254,0.98)] p-1 text-[color:var(--text-3)] hover:text-[color:var(--text-1)]"
            title="Remove file"
            aria-label="Remove file"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            type="text"
            placeholder="Type a message, drop context, or attach a file"
            {...register("message")}
            className="h-12 flex-1 rounded-2xl border-[color:var(--border-1)] bg-[color:rgba(240,245,252,0.78)] px-4 text-base"
            onBlur={() => {
              if (settings && settings.typingIndicator === false) return;
              if (!token || !room) return;
              void setTyping({ token, room, isTyping: false });
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} aria-label="Attach file" title="Attach file">
            <Paperclip className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={emojiOpen ? "secondary" : "outline"}
            size="icon"
            onClick={() => setEmojiOpen((value) => !value)}
            aria-label="Insert emoji"
            title="Insert emoji"
          >
            <Smile className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button type="submit" disabled={!canSend || isSubmitting || isUploading} size="lg" className="min-w-28 rounded-2xl">
            {isSubmitting || isUploading ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>

      {emojiOpen ? (
        <div className="absolute bottom-[calc(100%+0.75rem)] right-0 z-10 w-56 rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(233,241,251,0.96)] p-3 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.32)] backdrop-blur-xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Quick emoji</div>
          <div className="grid grid-cols-5 gap-2">
            {emojiList.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setValue("message", `${message ?? ""}${emoji}`, { shouldDirty: true });
                  setEmojiOpen(false);
                }}
                className={cn(
                  "rounded-2xl border border-[color:var(--border-1)] bg-[color:rgba(241,246,253,0.82)] px-1 py-2 text-base transition hover:border-[color:var(--border-2)] hover:bg-[color:rgba(247,250,254,0.98)]"
                )}
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
};

export { ChatForm };
