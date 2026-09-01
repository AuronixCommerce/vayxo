# VAYROX.online

VAYROX.online is a realtime social web app inspired by the best parts of X-style conversation and Instagram-style social discovery, without a reels/video-feed product. It is built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Firebase Authentication + Realtime Database, Framer Motion, and Groq-powered VAYROX AI.

## Core product

- Email/password and Google sign-in with verified-email gating.
- Live home feed with For You and Following tabs.
- Text posts up to 280 characters, threaded replies/comments, likes, reposts, bookmarks, sharing, and live engagement totals.
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
6. Run `npm install` and `npm run dev`, then open `http://localhost:3000`.

## Realtime data model

Primary paths include `users`, `usernames`, `posts`, `likes`, `reposts`, `bookmarks`, `following`, `followers`, `followRequests`, `conversations`, `messages`, `notifications`, `aiThreads`, `aiMessages`, and `supportTickets`. Fan-out indexes such as `likesByUser`, `repostsByUser`, `bookmarksByUser`, and `conversationsByUser` keep common reads fast.

Post engagement totals shown in the UI are derived from live reaction/reply data rather than trusting arbitrary client-written counters.

## Admin and security

The admin console trusts `users/{uid}/role === "admin"`, but database rules prevent normal users from changing their own `role` or `suspended` fields. Assign the first admin manually through a trusted Firebase administrative workflow. Suspended users are blocked by the app gate and from new post/reaction writes.

## Media

The data model already supports media arrays and `.env.example` retains S3-compatible/R2 configuration placeholders. A production media uploader should use short-lived presigned upload URLs, validate file type/size server-side, and write only returned object metadata to posts/messages. Do not expose S3/R2 secret keys to the browser.

## Deployment

For Vercel, import this repository with root directory `/`, use the **Next.js** framework preset, leave the output directory at the Next.js default, add all required environment values, and deploy. Node 22+ is required.

## Main routes

`/home`, `/explore`, `/notifications`, `/messages`, `/i/bookmarks`, `/compose/post`, `/[username]`, `/[username]/followers`, `/[username]/following`, `/[username]/status/[postId]`, `/post/[postId]`, `/settings`, `/settings/profile`, `/ai`, `/help`, `/login`, `/signup`, `/admin`, and `/legal`.
