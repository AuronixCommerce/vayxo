# VAYROX.online

VAYROX.online is a realtime social web app inspired by the best parts of X-style conversation and Instagram-style social discovery, without a reels/video-feed product. It is built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Firebase Authentication + Realtime Database, Framer Motion, Cloudflare R2-compatible image uploads, and Groq-powered VAYROX AI.

## Core product

- Email/password and Google sign-in with verified-email gating.
- Live home feed with For You and Following tabs.
- Text posts up to 280 characters, threaded replies/comments, likes, reposts, bookmarks, sharing, and live engagement totals.
- Full `/compose/post` experience with direct image upload to R2/S3-compatible storage, preview/removal, file validation, and public media delivery.
- User profiles with Posts, Replies, Reposts, and private Likes tabs.
- Followers/following counts plus dedicated follower and following list pages.
- Protected follow mode with follow requests and approve/reject controls.
- Realtime notifications for likes, replies, reposts, follows, follow requests, and sign-ins.
- Realtime direct messages and conversation history.
- Explore search across people and posts plus live hashtag trends.
- Profile editing, appearance controls, support tickets, moderation admin console, legal center, and VAYROX AI.
- Suspended-account enforcement and hardened Realtime Database role rules.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. In Firebase Console, enable Email/Password and optionally Google under Authentication → Sign-in method.
3. Create a Realtime Database, then deploy `database.rules.json` with `firebase deploy --only database` or paste the rules in Firebase Console.
4. Add `localhost` and the deployed VAYROX domain to Firebase Authentication authorized domains.
5. Create a Groq API key and set `GROQ_API_KEY`. AI requests require a verified Firebase session and the key stays server-side.
6. Configure R2/S3-compatible storage values (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_URL`) if you want image posting.
7. Run `npm install` and `npm run dev`, then open `http://localhost:3000`.

## Realtime data model

Primary paths include `users`, `usernames`, `posts`, `likes`, `reposts`, `bookmarks`, `following`, `followers`, `followRequests`, `conversations`, `messages`, `notifications`, `aiThreads`, `aiMessages`, and `supportTickets`. Fan-out indexes such as `likesByUser`, `repostsByUser`, `bookmarksByUser`, and `conversationsByUser` keep common reads fast.

Post engagement totals shown in the UI are derived from live reaction/reply data rather than trusting arbitrary client-written counters. At large scale, move those aggregates to trusted server/Cloud Function counters to avoid reading full reaction trees.

## Admin and security

The admin console trusts `users/{uid}/role === "admin"`, but database rules prevent normal users from changing their own `role` or `suspended` fields. Assign the first admin manually through a trusted Firebase administrative workflow. Suspended users are blocked by the app gate and from new post/reaction writes. Admins can manage users, posts, and support tickets.

## R2 image uploads

`/api/media/presign` validates a verified Firebase session, image MIME type, and an 8 MB size limit, then creates a short-lived SigV4 `PUT` URL. The browser uploads directly to R2, so secret access credentials never reach the client.

Your R2 bucket must have browser CORS configured for your local and production VAYROX origins. Allow `PUT` and the `Content-Type` request header. `S3_PUBLIC_URL` should point to the bucket's public/custom delivery domain so post images can be displayed after upload.

## Deployment

For Vercel, import this repository with root directory `/`, use the **Next.js** framework preset, leave the output directory at the Next.js default, add all required environment values, and deploy. Node 22+ is required.

## Main routes

`/home`, `/explore`, `/notifications`, `/messages`, `/i/bookmarks`, `/compose/post`, `/[username]`, `/[username]/followers`, `/[username]/following`, `/[username]/status/[postId]`, `/post/[postId]`, `/settings`, `/settings/profile`, `/ai`, `/help`, `/login`, `/signup`, `/admin`, and `/legal`.
