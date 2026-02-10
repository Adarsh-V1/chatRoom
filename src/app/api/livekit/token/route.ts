import { NextResponse } from "next/server";
import { z } from "zod";

import { AccessToken } from "livekit-server-sdk";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().min(1),
  roomId: z.string().min(1),
  identity: z.string().min(1).optional(),
});

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function getConvexClient() {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL) is not set");
  return new ConvexHttpClient(url);
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    const convex = getConvexClient();
    const me = await convex.query(api.auth.getSessionUser, { token: body.token });
    if (!me) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const requestedIdentity = (body.identity ?? "").trim().toLowerCase();
    const actualIdentity = (me.name ?? "").trim().toLowerCase();

    if (requestedIdentity && requestedIdentity !== actualIdentity) {
      return NextResponse.json(
        { ok: false, error: "Identity mismatch" },
        { status: 403 }
      );
    }

    const apiKey = getRequiredEnv("LIVEKIT_API_KEY");
    const apiSecret = getRequiredEnv("LIVEKIT_API_SECRET");
    const livekitUrl = getRequiredEnv("LIVEKIT_URL");

    const at = new AccessToken(apiKey, apiSecret, {
      identity: me.name,
      name: me.name,
    });

    at.addGrant({
      room: body.roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({
      ok: true,
      token: at.toJwt(),
      url: livekitUrl,
      identity: me.name,
      roomId: body.roomId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not set")
      ? 500
      : message.includes("fetch failed")
        ? 502
        : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
