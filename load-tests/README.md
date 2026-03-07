# Load Testing

This project includes both **k6** and **Artillery** scenarios targeting the performance endpoint:

- `POST /api/perf/chat-snapshot`

## 1) Enable perf route

Set these env vars before starting the app:

- `ENABLE_PERF_ROUTES=true`
- `CHAT_TOKEN=<valid app session token>`
- `CHAT_ROOM=general` (or another room id)
- Optional: `PERF_API_KEY=<shared key>`

If `PERF_API_KEY` is set, load tests must send the same value as `x-perf-key`.

## 2) Run app

```bash
npm run dev
```

## 3) Run Artillery

```bash
BASE_URL=http://localhost:3000 CHAT_TOKEN=... CHAT_ROOM=general npm run loadtest:artillery
```

## 4) Run k6

```bash
BASE_URL=http://localhost:3000 CHAT_TOKEN=... CHAT_ROOM=general npm run loadtest:k6
```

## Suggested performance targets

- p95 latency: `< 450ms`
- p99 latency: `< 900ms`
- Error rate: `< 2%`

## Notes

- Use staging/dev data for write-heavy experiments.
- Keep perf routes disabled in normal production operation by leaving `ENABLE_PERF_ROUTES` unset.
