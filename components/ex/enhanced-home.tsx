'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  Bookmark,
  Compass,
  Feather,
  Home,
  Mail,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from './auth-provider';
import {
  followUser,
  subscribeFollowing,
  subscribeReactionCounts,
  subscribeReplyCounts,
  subscribeUserReactions,
  subscribeUsers,
  type RealtimePost,
  type UserProfile,
} from '@/lib/firebase/realtime';
import { subscribeMutedWords, subscribeProductTimeline } from '@/lib/firebase/product';
import { SocialPostCard } from './social-post-card';
import { Brand } from './brand';

const safeText = (value: unknown) => (typeof value === 'string' ? value : '');
const safeUsername = (profile: Partial<UserProfile> | null | undefined) =>
  typeof profile?.username === 'string' && profile.username.trim() ? profile.username.trim() : 'user';
const safeDisplayName = (profile: Partial<UserProfile> | null | undefined) => {
  if (typeof profile?.displayName === 'string' && profile.displayName.trim()) return profile.displayName.trim();
  const username = safeUsername(profile);
  return username === 'user' ? 'VAYROX user' : username;
};

export function EnhancedHome() {
  const { user, profile, configured } = useAuth();
  const [posts, setPosts] = useState<RealtimePost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState(new Set<string>());
  const [likes, setLikes] = useState(new Set<string>());
  const [reposts, setReposts] = useState(new Set<string>());
  const [bookmarks, setBookmarks] = useState(new Set<string>());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [repostCounts, setRepostCounts] = useState<Record<string, number>>({});
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [mutedWords, setMutedWords] = useState<string[]>([]);
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const a = subscribeProductTimeline(
      user?.uid,
      (items) => {
        setPosts(Array.isArray(items) ? items.filter(Boolean) : []);
        setLoading(false);
      },
      150,
    );
    const b = subscribeUsers((items) => setUsers(Array.isArray(items) ? items.filter(Boolean) : []));
    const c = subscribeReactionCounts('likes', setLikeCounts);
    const d = subscribeReactionCounts('reposts', setRepostCounts);
    const e = subscribeReplyCounts(setReplyCounts);

    return () => {
      a();
      b();
      c();
      d();
      e();
    };
  }, [configured, user?.uid, pulse]);

  useEffect(() => {
    if (!user) return;
    const a = subscribeFollowing(user.uid, setFollowing);
    const b = subscribeUserReactions(user.uid, 'likes', setLikes);
    const c = subscribeUserReactions(user.uid, 'reposts', setReposts);
    const d = subscribeUserReactions(user.uid, 'bookmarks', setBookmarks);
    const e = subscribeMutedWords(user.uid, (words) =>
      setMutedWords(Array.isArray(words) ? words.filter((word): word is string => typeof word === 'string') : []),
    );
    return () => {
      a();
      b();
      c();
      d();
      e();
    };
  }, [user]);

  const people = useMemo(
    () =>
      new Map(
        users
          .filter((item) => item && typeof item.uid === 'string' && item.uid)
          .map((item) => [item.uid, item] as const),
      ),
    [users],
  );

  const visible = useMemo(
    () =>
      posts
        .filter((post) => {
          if (!post || typeof post.id !== 'string' || typeof post.authorId !== 'string') return false;
          const haystack = safeText(post.text).toLowerCase();
          return !mutedWords.some((word) => haystack.includes(safeText(word).toLowerCase()));
        })
        .filter(
          (post) => tab === 'foryou' || post.authorId === user?.uid || following.has(post.authorId),
        ),
    [posts, mutedWords, tab, user?.uid, following],
  );

  const trends = useMemo(() => {
    const counts = new Map<string, number>();
    visible
      .flatMap((post) => safeText(post.text).match(/#[\p{L}\d_]+/gu) || [])
      .forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [visible]);

  const suggestions = users
    .filter(
      (item) =>
        item &&
        typeof item.uid === 'string' &&
        Boolean(item.uid) &&
        typeof item.username === 'string' &&
        Boolean(item.username.trim()) &&
        !item.suspended &&
        item.uid !== user?.uid &&
        !following.has(item.uid),
    )
    .slice(0, 5);

  async function follow(person: UserProfile) {
    if (!user) {
      location.href = '/login';
      return;
    }
    if (!person?.uid) return;
    await followUser(user.uid, person.uid);
  }

  return (
    <div className="min-h-[100dvh]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 md:grid-cols-[92px_minmax(0,650px)] lg:grid-cols-[248px_minmax(0,650px)_340px]">
        <Sidebar username={profile?.username} />
        <main className="min-h-[100dvh] border-x bg-background/60">
          <header className="sticky top-0 z-30 border-b bg-background/82 backdrop-blur-3xl">
            <div className="flex h-14 items-center px-4">
              <div className="md:hidden">
                <Brand compact />
              </div>
              <h1 className="ml-3 text-lg font-black md:ml-0">Home</h1>
              <Link href="/settings" className="ml-auto rounded-full p-2 hover:bg-secondary">
                <Settings className="size-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2">
              <Tab active={tab === 'foryou'} onClick={() => setTab('foryou')}>
                For you
              </Tab>
              <Tab active={tab === 'following'} onClick={() => setTab('following')}>
                Following
              </Tab>
            </div>
          </header>

          <Link href="/compose/post" className="flex gap-3 border-b p-4 transition hover:bg-secondary/30">
            <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-black">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                safeDisplayName(profile).slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="flex-1 rounded-2xl border bg-background/60 px-4 py-3 text-muted-foreground">
              What’s happening?
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-foreground text-background">
              <Feather className="size-4" />
            </span>
          </Link>

          {loading ? (
            <FeedLoader />
          ) : visible.length ? (
            visible.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                author={people.get(post.authorId)}
                liked={likes.has(post.id)}
                reposted={reposts.has(post.id)}
                bookmarked={bookmarks.has(post.id)}
                likeCount={likeCounts[post.id] || 0}
                repostCount={repostCounts[post.id] || 0}
                replyCount={replyCounts[post.id] || 0}
                onChanged={() => setPulse((value) => value + 1)}
              />
            ))
          ) : (
            <Empty tab={tab} />
          )}
        </main>

        <aside className="hidden px-5 lg:block">
          <div className="sticky top-0 space-y-5 py-3">
            <Link
              href="/explore"
              className="flex h-11 items-center gap-3 rounded-full border bg-background/65 px-4 text-muted-foreground backdrop-blur-xl hover:bg-secondary"
            >
              <Search className="size-5" />
              Search VAYROX
            </Link>

            <Rail title="Trends for you">
              {trends.length ? (
                trends.map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/hashtag/${encodeURIComponent(tag.slice(1))}`}
                    className="block px-4 py-3 hover:bg-secondary"
                  >
                    <b className="block">{tag}</b>
                    <small className="text-muted-foreground">{count} recent posts</small>
                  </Link>
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground">Trends appear as people post hashtags.</p>
              )}
            </Rail>

            <Rail title="Who to follow">
              {suggestions.map((person) => {
                const username = safeUsername(person);
                const displayName = safeDisplayName(person);
                return (
                  <div key={person.uid} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-black">
                      {person.avatarUrl ? (
                        <img src={person.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        displayName.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <Link href={`/vx/${encodeURIComponent(username)}`} className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{displayName}</b>
                      <small className="text-muted-foreground">@{username}</small>
                    </Link>
                    <button
                      onClick={() => follow(person)}
                      className="rounded-full bg-foreground px-3 py-2 text-xs font-bold text-background"
                    >
                      Follow
                    </button>
                  </div>
                );
              })}
            </Rail>

            <Rail title="Your tools">
              <div className="grid grid-cols-2 gap-2 p-3">
                <Quick href="/analytics" icon={<BarChart3 className="size-4" />}>
                  Analytics
                </Quick>
                <Quick href="/lists" icon={<Users className="size-4" />}>
                  Lists
                </Quick>
                <Quick href="/drafts" icon={<Feather className="size-4" />}>
                  Drafts
                </Quick>
                <Quick href="/settings/notifications" icon={<Bell className="size-4" />}>
                  Alerts
                </Quick>
              </div>
            </Rail>
          </div>
        </aside>
      </div>

      <Link
        href="/compose/post"
        className="fixed bottom-24 right-4 z-30 grid size-14 place-items-center rounded-full bg-foreground text-background shadow-2xl md:hidden"
      >
        <Feather className="size-6" />
      </Link>
    </div>
  );
}

const nav = [
  ['/home', 'Home', Home],
  ['/explore', 'Explore', Compass],
  ['/notifications', 'Notifications', Bell],
  ['/messages', 'Messages', Mail],
  ['/i/bookmarks', 'Bookmarks', Bookmark],
  ['/analytics', 'Analytics', BarChart3],
  ['/ai', 'VAYROX AI', Sparkles],
] as const;

function Sidebar({ username }: { username?: string }) {
  const profileHref =
    typeof username === 'string' && username.trim()
      ? `/vx/${encodeURIComponent(username.trim())}`
      : '/login';

  return (
    <aside className="fixed bottom-0 z-40 flex w-full justify-around border-t bg-background/80 p-2 backdrop-blur-3xl md:sticky md:top-0 md:h-[100dvh] md:w-auto md:flex-col md:justify-start md:border-r md:border-t-0 md:px-4 md:py-4">
      <Link href="/home" className="mb-5 hidden px-3 md:block">
        <Brand />
      </Link>
      <nav className="flex w-full justify-around md:flex-col">
        {nav.map(([href, label, Icon]) => (
          <Link key={href} href={href} className="flex items-center gap-4 rounded-2xl p-3 hover:bg-secondary">
            <Icon className="size-[22px]" />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
        <Link href={profileHref} className="flex items-center gap-4 rounded-2xl p-3 hover:bg-secondary">
          <UserRound className="size-[22px]" />
          <span className="hidden lg:block">Profile</span>
        </Link>
      </nav>
      <Link
        href="/compose/post"
        className="mt-5 hidden h-12 items-center justify-center gap-2 rounded-full bg-foreground font-bold text-background md:flex"
      >
        <Feather className="size-5" />
        <span className="hidden lg:inline">Post</span>
      </Link>
    </aside>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="relative h-12 text-sm font-bold hover:bg-secondary/60">
      {children}
      {active && (
        <motion.span
          layoutId="enhanced-home-tab"
          className="absolute inset-x-10 bottom-0 h-[3px] rounded-full bg-foreground"
        />
      )}
    </button>
  );
}

function Rail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[24px] border bg-background/55">
      <h2 className="px-4 pt-4 text-xl font-black">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Quick({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs font-bold hover:-translate-y-0.5">
      {icon}
      {children}
    </Link>
  );
}

function FeedLoader() {
  return (
    <div>
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex animate-pulse gap-3 border-b p-4">
          <div className="size-10 rounded-full bg-secondary" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/5 rounded bg-secondary" />
            <div className="h-4 w-11/12 rounded bg-secondary" />
            <div className="h-4 w-8/12 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ tab }: { tab: string }) {
  return (
    <div className="px-8 py-24 text-center">
      <h2 className="text-2xl font-black">
        {tab === 'following' ? 'Your following feed is quiet' : 'Start the conversation'}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {tab === 'following'
          ? 'Follow more people or switch to For you.'
          : 'Create a post or explore people and topics.'}
      </p>
    </div>
  );
}
