import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().min(1),
  room: z.string().min(1),
  messageLimit: z.number().int().positive().max(200).optional(),
});

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) is not set");
  return new ConvexHttpClient(url);
}

function perfRouteEnabled(req: Request): boolean {
  if (process.env.ENABLE_PERF_ROUTES !== "true") return false;

  const requiredKey = process.env.PERF_API_KEY;
  if (!requiredKey) return true;

  const provided = req.headers.get("x-perf-key") ?? "";
  return provided.trim() === requiredKey;
}

export async function POST(req: Request) {
  if (!perfRouteEnabled(req)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  try {
    const body = BodySchema.parse(await req.json());
    const client = getConvexClient();

    const start = performance.now();

    const [me, unread, typing, chats] = await Promise.all([
      client.query(api.auth.getSessionUser, { token: body.token }),
      client.query(api.unread.getUnreadInfo, { token: body.token, room: body.room }),
      client.query(api.typing.getTypingUsers, { token: body.token, room: body.room }),
      client.query(api.chats.getChats, {
        token: body.token,
        room: body.room,
        limit: body.messageLimit ?? 70,
      }),
    ]);

    const elapsedMs = performance.now() - start;

    return NextResponse.json({
      ok: true,
      metrics: {
        elapsedMs: Number(elapsedMs.toFixed(2)),
        room: body.room,
        messageCount: Array.isArray(chats) ? chats.length : 0,
        unreadCount: unread?.unreadCount ?? 0,
        typingCount: Array.isArray(typing) ? typing.length : 0,
        payloadBytes: Buffer.byteLength(JSON.stringify(chats ?? []), "utf8"),
        user: me?.name ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
