# VAYXO.online

Production-oriented social web app built with TypeScript, the Next App Router-compatible Vinext runtime, Tailwind CSS, Firebase Authentication + Realtime Database, Framer Motion, Groq AI, and configurable S3-compatible media storage.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. In Firebase Console, enable Email/Password and optionally Google under Authentication → Sign-in method.
3. Create a Realtime Database, then deploy `database.rules.json` with `firebase deploy --only database` (or paste it in the Firebase rules editor).
4. Add `localhost` and the deployed domain to Firebase Authentication's authorized domains.
5. Create a Groq API key and set `GROQ_API_KEY`. The server-only key is never exposed to the browser.
6. Run `npm run dev`, then open `http://localhost:3000`.

## Data model

Realtime Database paths include `users`, `usernames`, `posts`, `likes`, `reposts`, `bookmarks`, `following`, `followers`, `conversations`, `messages`, and `notifications`. Fan-out paths make user bookmarks/reposts and follower lists cheap to query. Post view counts should be aggregated through a trusted server/Cloud Function in production to prevent client manipulation.

## Media

Set the `S3_*` values for Cloudflare R2 or another S3-compatible service. Production uploads should use short-lived presigned PUT URLs, validate MIME type and size server-side, and store returned object metadata under the owning post/message record.

## Deployment

For Vercel, import the repository, add every environment value, and deploy. Use Node 22+. Keep Firebase and Groq secrets server-side. The included database rules enforce ownership and conversation membership; review them against your moderation and privacy policy before launch.

## Available routes

`/home`, `/explore`, `/notifications`, `/messages`, `/i/bookmarks`, `/compose/post`, `/[username]`, `/[username]/status/[postId]`, `/settings/profile`, `/login`, and `/signup`.
