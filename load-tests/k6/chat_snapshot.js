import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const CHAT_TOKEN = __ENV.CHAT_TOKEN || "";
const CHAT_ROOM = __ENV.CHAT_ROOM || "general";
const PERF_API_KEY = __ENV.PERF_API_KEY || "";

export const options = {
  scenarios: {
    read_heavy: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "30s", target: 60 },
        { duration: "1m", target: 120 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    "http_req_duration{endpoint:chat-snapshot}": ["p(95)<450", "p(99)<800"],
    checks: ["rate>0.98"],
  },
};

export default function scenario() {
  if (!CHAT_TOKEN) {
    throw new Error("Set CHAT_TOKEN env var before running this test.");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (PERF_API_KEY) {
    headers["x-perf-key"] = PERF_API_KEY;
  }

  const res = http.post(
    `${BASE_URL}/api/perf/chat-snapshot`,
    JSON.stringify({
      token: CHAT_TOKEN,
      room: CHAT_ROOM,
      messageLimit: 70,
    }),
    {
      headers,
      tags: { endpoint: "chat-snapshot" },
    }
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response ok": (r) => {
      try {
        const body = r.json();
        return body && body.ok === true;
      } catch {
        return false;
      }
    },
  });

  sleep(0.15);
}
