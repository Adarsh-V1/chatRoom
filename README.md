This is a [Next.js](https://nextjs.org) + Convex chat project.

## Authentication

The app supports:

- Username/password login
- Google One Tap / Google Sign-In (server-verified ID token flow)

### Google auth setup

Add these env vars:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
GOOGLE_CLIENT_ID=your_google_web_client_id
```

Notes:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is used on the client for Google Identity Services.
- `GOOGLE_CLIENT_ID` is used on the server to verify Google ID tokens in `/api/auth/google`.
- If users upload a custom avatar later, that avatar overrides Google profile photo in chat UI.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# chatRoom
# chatRoom
# chatRoom
# chatRoom
# chatRoom
