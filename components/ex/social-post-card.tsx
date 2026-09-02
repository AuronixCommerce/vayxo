'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Heart, Lock, MessageCircle, Quote, Repeat2, Share2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  createNotification,
  subscribePost,
  toggleReaction,
  type RealtimePost,
  type UserProfile,
} from '@/lib/firebase/realtime';
import { subscribePostMeta, type PostMeta } from '@/lib/firebase/product';
import { useAuth } from './auth-provider';

const safeText = (value: unknown) => (typeof value === 'string' ? value : '');
const safeHandle = (value: unknown, fallback = 'user') => {
  const handle = safeText(value).trim();
  return handle || fallback;
};
const safeName = (value: unknown, fallback = 'VAYROX user') => {
  const name = safeText(value).trim();
  return name || fallback;
};
const safeMedia = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];

export function SocialPostCard({
  post,
  author,
  likeCount = 0,
  repostCount = 0,
  replyCount = 0,
  liked = false,
  reposted = false,
  bookmarked = false,
  onChanged,
}: {
  post: RealtimePost;
  author?: UserProfile;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  onChanged?: () => void;
}) {
  const { user, profile } = useAuth();
  const [meta, setMeta] = useState<PostMeta>({ audience: 'everyone', replyPermission: 'everyone' });
  const postId = safeText(post?.id);
  const username = safeHandle(post?.username, safeHandle(post?.authorId));
  const authorName = safeName(post?.authorName, username);
  const text = safeText(post?.text);
  const media = safeMedia(post?.media);
  const quotePostId = safeText(post?.quotePostId);

  useEffect(() => {
    if (!postId) return;
    try {
      return subscribePostMeta(postId, (value) => {
        const audience =
          value?.audience === 'followers' ||
          value?.audience === 'close_friends' ||
          value?.audience === 'only_me'
            ? value.audience
            : 'everyone';
        const replyPermission =
          value?.replyPermission === 'following' ||
          value?.replyPermission === 'mentioned' ||
          value?.replyPermission === 'nobody'
            ? value.replyPermission
            : 'everyone';
        setMeta({ ...value, audience, replyPermission });
      });
    } catch (error) {
      console.error('VAYROX could not subscribe to post metadata', error);
      return;
    }
  }, [postId]);

  async function react(type: 'likes' | 'reposts' | 'bookmarks') {
    if (!user || !profile) {
      location.href = '/login';
      return;
    }
    if (!postId) return;
    const active = await toggleReaction(user.uid, postId, type);
    if (active && type !== 'bookmarks' && post.authorId && post.authorId !== user.uid) {
      await createNotification(post.authorId, {
        actorId: user.uid,
        actorName: safeName(profile.displayName, safeHandle(profile.username)),
        type: type === 'likes' ? 'like' : 'repost',
        postId,
      });
    }
    onChanged?.();
  }

  async function share() {
    if (!postId) return;
    const url = `${location.origin}/vx/${encodeURIComponent(username)}/status/${encodeURIComponent(postId)}`;
    if (navigator.share) {
      await navigator.share({ title: `${authorName} on VAYROX`, text, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  const statusHref = postId
    ? `/vx/${encodeURIComponent(username)}/status/${encodeURIComponent(postId)}`
    : '/home';
  const profileHref = `/vx/${encodeURIComponent(username)}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b px-4 py-4 transition hover:bg-secondary/20"
    >
      <div className="flex gap-3">
        <Link href={profileHref} className="shrink-0">
          <Avatar p={author} fallback={authorName} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1 text-sm">
            <Link href={profileHref} className="truncate font-black hover:underline">
              {authorName}
            </Link>
            <span className="truncate text-muted-foreground">@{username}</span>
            <span className="text-muted-foreground">· {time(post?.createdAt)}</span>
            {(Boolean(post?.isPrivate) || meta.audience !== 'everyone') && (
              <Audience meta={meta} privatePost={Boolean(post?.isPrivate)} />
            )}
            {meta.editedAt && <span className="ml-auto text-[10px] text-muted-foreground">Edited</span>}
          </div>

          <Link href={statusHref} className="block">
            <RichText text={text} />
            {media.length ? (
              <div
                className={`mt-3 grid overflow-hidden rounded-2xl border ${media.length > 1 ? 'grid-cols-2' : ''}`}
              >
                {media.map((url) => (
                  <img key={url} src={url} alt="Post media" className="max-h-[460px] size-full object-cover" />
                ))}
              </div>
            ) : null}
          </Link>

          {quotePostId && <QuotePreview id={quotePostId} />}

          <div className="mt-3 flex max-w-md items-center justify-between text-muted-foreground">
            <Action label="Reply" count={replyCount} onClick={() => (location.href = statusHref)}>
              <MessageCircle className="size-[18px]" />
            </Action>
            <Action label="Repost" count={repostCount} active={reposted} onClick={() => react('reposts')}>
              <Repeat2 className="size-[18px]" />
            </Action>
            <Action label="Like" count={likeCount} active={liked} onClick={() => react('likes')}>
              <Heart className="size-[18px]" fill={liked ? 'currentColor' : 'none'} />
            </Action>
            <Link
              href={postId ? `/compose/post?quote=${encodeURIComponent(postId)}` : '/compose/post'}
              className="rounded-full p-2 hover:bg-secondary"
              aria-label="Quote post"
            >
              <Quote className="size-[18px]" />
            </Link>
            <button
              onClick={() => react('bookmarks')}
              className={`rounded-full p-2 hover:bg-secondary ${bookmarked ? 'text-foreground' : ''}`}
              aria-label="Bookmark"
            >
              <Bookmark className="size-[18px]" fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={share} className="rounded-full p-2 hover:bg-secondary" aria-label="Share">
              <Share2 className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Action({
  children,
  label,
  count,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full p-2 hover:bg-secondary ${active ? 'text-foreground' : ''}`}
      aria-label={label}
    >
      {children}
      {safeCount > 0 && <span className="text-xs">{safeCount}</span>}
    </button>
  );
}

function Avatar({ p, fallback }: { p?: UserProfile; fallback?: string }) {
  const label = safeName(p?.displayName, safeName(fallback, safeHandle(p?.username)));
  const avatarUrl = typeof p?.avatarUrl === 'string' ? p.avatarUrl : '';
  return (
    <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-black ring-1 ring-border">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        label.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

function Audience({ meta, privatePost }: { meta: PostMeta; privatePost?: boolean }) {
  const audience =
    meta?.audience === 'followers' || meta?.audience === 'close_friends' || meta?.audience === 'only_me'
      ? meta.audience
      : 'everyone';
  const icon = audience === 'close_friends' ? <Users className="size-3" /> : <Lock className="size-3" />;
  return (
    <span title={audience.replace('_', ' ')} className="ml-1 inline-flex items-center text-muted-foreground">
      {privatePost || audience !== 'everyone' ? icon : null}
    </span>
  );
}

function RichText({ text }: { text?: string | null }) {
  const safe = safeText(text);
  const parts = useMemo(() => safe.split(/([@#][\p{L}\d_]+)/gu), [safe]);
  return (
    <p className="mt-1 whitespace-pre-wrap text-[15.5px] leading-[1.52]">
      {parts.map((part, index) =>
        part.startsWith('@') ? (
          <Link
            key={index}
            href={`/vx/${encodeURIComponent(part.slice(1))}`}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {part}
          </Link>
        ) : part.startsWith('#') ? (
          <Link
            key={index}
            href={`/hashtag/${encodeURIComponent(part.slice(1))}`}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {part}
          </Link>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

function QuotePreview({ id }: { id: string }) {
  const [quoted, setQuoted] = useState<RealtimePost | null>(null);
  useEffect(() => {
    if (!id) return;
    try {
      return subscribePost(id, setQuoted);
    } catch (error) {
      console.error('VAYROX could not subscribe to quoted post', error);
      return;
    }
  }, [id]);

  if (!quoted) {
    return (
      <Link href={`/post/${encodeURIComponent(id)}`} className="mt-3 block rounded-2xl border p-3 text-sm text-muted-foreground">
        Quoted post unavailable · Open →
      </Link>
    );
  }

  const username = safeHandle(quoted.username, safeHandle(quoted.authorId));
  const authorName = safeName(quoted.authorName, username);
  const text = safeText(quoted.text);
  const media = safeMedia(quoted.media);
  const quotedId = safeText(quoted.id) || id;

  return (
    <Link
      href={`/vx/${encodeURIComponent(username)}/status/${encodeURIComponent(quotedId)}`}
      className="mt-3 block rounded-2xl border p-3 transition hover:bg-secondary/40"
    >
      <div className="text-sm">
        <b>{authorName}</b> <span className="text-muted-foreground">@{username}</span>
      </div>
      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm leading-6">{text}</p>
      {media[0] && <img src={media[0]} alt="Quoted media" className="mt-2 max-h-44 w-full rounded-xl object-cover" />}
    </Link>
  );
}

const time = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 'now';
  const seconds = Math.max(0, Math.floor((Date.now() - numeric) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  const date = new Date(numeric);
  return Number.isNaN(date.getTime())
    ? 'now'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
