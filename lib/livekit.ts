import { z } from "zod";

const TokenResponseSchema = z.object({
  ok: z.boolean(),
  token: z.string().optional(),
  url: z.string().optional(),
  identity: z.string().optional(),
  roomId: z.string().optional(),
  error: z.string().optional(),
});

export type LiveKitTokenResponse = z.infer<typeof TokenResponseSchema>;

export async function fetchLiveKitToken(params: {
  token: string;
  roomId: string;
  identity?: string;
}): Promise<{ token: string; url: string; identity: string; roomId: string }> {
  const res = await fetch("/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const json = TokenResponseSchema.parse(await res.json());

  if (!res.ok || !json.ok) {
    throw new Error(json.error || "Failed to get LiveKit token");
  }

  if (!json.token || !json.url || !json.identity || !json.roomId) {
    throw new Error("LiveKit token response missing fields");
  }

  return {
    token: json.token,
    url: json.url,
    identity: json.identity,
    roomId: json.roomId,
  };
}
