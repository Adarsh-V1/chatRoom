import { NextResponse } from "next/server";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

const BodySchema = z.object({
  credential: z.string().min(1),
});

function getGoogleClientId(): string {
  const value = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_ID (or NEXT_PUBLIC_GOOGLE_CLIENT_ID) is not set");
  }
  return value;
}

function getConvexClient() {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL) is not set");
  return new ConvexHttpClient(url);
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const clientId = getGoogleClientId();

    const oauth = new OAuth2Client(clientId);
    const ticket = await oauth.verifyIdToken({
      idToken: body.credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      return NextResponse.json({ ok: false, error: "Invalid Google token" }, { status: 401 });
    }

    const email = typeof payload.email === "string" ? payload.email : undefined;
    const name = typeof payload.name === "string" ? payload.name : undefined;
    const picture = typeof payload.picture === "string" ? payload.picture : undefined;

    const convex = getConvexClient();
    const result = await convex.mutation(api.auth.loginWithGoogle, {
      googleSub: payload.sub,
      email,
      name,
      picture,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message.toLowerCase().includes("invalid") || message.toLowerCase().includes("token")
        ? 401
        : message.includes("not set")
          ? 500
          : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
