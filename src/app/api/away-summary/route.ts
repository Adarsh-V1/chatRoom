import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().min(1),
  room: z.string().min(1),
  limit: z.number().int().positive().max(500).optional(),
});

type UnreadMessage = {
  _id: string;
  _creationTime: number;
  username?: string;
  message: string;
  kind?: "text" | "file";
  fileName?: string;
  contextType?: "file" | "snippet" | "task";
  contextData?: string;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

function safeTrim(s: string, max = 240) {
  const t = (s ?? "").toString().trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function heuristicSummary(messages: UnreadMessage[], meName: string): string[] {
  const bullets: string[] = [];
  const meLower = meName.trim().toLowerCase();
  const mentionHits = messages.filter((m) => {
    const text = (m.message ?? "").toLowerCase();
    if (!meLower) return false;
    return text.includes(`@${meLower}`) || text.includes(meLower);
  });

  if (mentionHits.length > 0) {
    const first = mentionHits[0];
    bullets.push(`Mentions: ${safeTrim(first.message, 160)}`);
  }

  const actionish = messages.find((m) =>
    /\b(todo|action item|please|can you|could you|need to|should|follow up|fix|review)\b/i.test(
      m.message ?? ""
    )
  );
  if (actionish) {
    bullets.push(`Action: ${safeTrim(actionish.message, 160)}`);
  }

  // Key points: take up to 4 recent distinct messages.
  const recent = [...messages].slice(-6).reverse();
  for (const m of recent) {
    if (bullets.length >= 6) break;
    const text = safeTrim(m.message, 180);
    if (!text) continue;
    const who = (m.username ?? "someone").trim() || "someone";
    const line = `${who}: ${text}`;
    if (bullets.some((b) => b.includes(text))) continue;
    bullets.push(line);
  }

  return bullets.slice(0, 6);
}

async function openAiBullets(messages: UnreadMessage[], meName: string): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const payload = {
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You write short chat catch-up summaries. Output STRICT JSON with shape: {\"bullets\": string[]}. Bullets must be short, factual, and include: key points, mentions of the user if any, and action items if any.",
      },
      {
        role: "user",
        content: JSON.stringify({
          me: meName,
          unreadMessages: messages.map((m) => ({
            username: m.username ?? null,
            text: m.message,
            kind: m.kind ?? "text",
            fileName: m.fileName ?? null,
            contextType: m.contextType ?? null,
            contextData: m.contextData ?? null,
          })),
        }),
      },
    ],
    temperature: 0.2,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return null;
  const json: unknown = await res.json();
  const content =
    typeof json === "object" && json !== null
      ? (json as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message
          ?.content
      : undefined;
  if (typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content) as { bullets?: unknown };
    if (!Array.isArray(parsed.bullets)) return null;
    const bullets = parsed.bullets
      .filter((b) => typeof b === "string")
      .map((b) => b.trim())
      .filter(Boolean)
      .slice(0, 12);
    return bullets.length > 0 ? bullets : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const client = getConvexClient();

    const me = await client.query(api.auth.getSessionUser, { token: body.token });
    const meName = me?.name ?? "";

    const unread = (await client.query(api.unread.getUnreadMessages, {
      token: body.token,
      room: body.room,
      limit: body.limit ?? 200,
    })) as unknown as UnreadMessage[];

    if (!unread || unread.length === 0) {
      return NextResponse.json({ ok: true, stored: false, bullets: [] });
    }

    const fromCreationTime = unread[0]!._creationTime;
    const toCreationTime = unread[unread.length - 1]!._creationTime;

    const bullets =
      (await openAiBullets(unread, meName)) ?? heuristicSummary(unread, meName);

    await client.mutation(api.unread.storeSummary, {
      token: body.token,
      room: body.room,
      unreadCount: unread.length,
      fromCreationTime,
      toCreationTime,
      bullets,
    });

    await client.mutation(api.unread.markRead, {
      token: body.token,
      room: body.room,
      lastReadCreationTime: toCreationTime,
    });

    return NextResponse.json({ ok: true, stored: true, bullets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
