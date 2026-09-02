'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Menu, MessageSquarePlus, Send, Square, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './auth-provider';
import {
  createAiThread,
  deleteAiThread,
  sendAiMessage,
  subscribeAiMessages,
  subscribeAiThreads,
  type AiMessage,
  type AiThread,
} from '@/lib/firebase/realtime';
import { AiMark } from './ai-mark';
import { ConfirmDialog } from './vayrox-overlays';

const ideas = [
  'Help me write a strong post',
  'Make this reply clearer',
  'Turn an idea into a thread',
  'Explain a VAYROX feature',
];

type AiResponse = {
  text?: string;
  error?: string;
  rateLimit?: { limit: number; remaining: number; resetAt: number };
};

export function AiChatV2() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AiThread[]>([]);
  const [id, setId] = useState('');
  const [items, setItems] = useState<AiMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AiThread | null>(null);
  const [notice, setNotice] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const first = useRef(true);
  const aborter = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeAiThreads(user.uid, (next) => {
      setThreads(next);
      if (first.current) {
        first.current = false;
        if (!id && next[0]) setId(next[0].id);
      }
    });
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeAiMessages(user.uid, id, (next) => {
      setItems(Array.isArray(next) ? next : []);
      setLoading(false);
    });
  }, [user, id]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: loading ? 'auto' : 'smooth' });
  }, [items, busy, loading]);

  useEffect(() => {
    if (!area.current) return;
    area.current.style.height = '0px';
    area.current.style.height = `${Math.min(180, Math.max(48, area.current.scrollHeight))}px`;
  }, [text]);

  const active = useMemo(() => threads.find((thread) => thread.id === id), [threads, id]);

  function flash(value: string) {
    setNotice(value);
    setTimeout(() => setNotice(''), 1800);
  }

  function newChat() {
    aborter.current?.abort();
    setId('');
    setItems([]);
    setText('');
    setHistoryOpen(false);
  }

  function choose(threadId: string) {
    if (busy) return;
    setId(threadId);
    setHistoryOpen(false);
  }

  async function remove() {
    if (!user || !deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await deleteAiThread(user.uid, target.id);
    if (id === target.id) newChat();
    flash('Conversation deleted');
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      flash('Copied');
    } catch {
      flash('Could not copy');
    }
  }

  function stop() {
    aborter.current?.abort();
    setBusy(false);
    flash('Stopped');
  }

  async function ask(value = text) {
    if (!user || !value.trim() || busy) return;
    if (!navigator.onLine) {
      flash('You’re offline. Reconnect to use VAYROX AI.');
      return;
    }

    const prompt = value.trim();
    setBusy(true);
    let threadId = id;

    try {
      if (!threadId) {
        threadId = await createAiThread(user.uid, prompt.slice(0, 50));
        setId(threadId);
      }

      await sendAiMessage(user.uid, threadId, 'user', prompt);
      setText('');

      const token = await user.getIdToken();
      const controller = new AbortController();
      aborter.current = controller;

      const response = await fetch('/api/ai', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          context: 'VAYROX AI chat',
          memory: items.slice(-16).map((item) => `${item.role}: ${item.text}`).join('\n'),
        }),
      });

      const payload = (await response.json()) as AiResponse;
      if (payload.rateLimit) setRemaining(payload.rateLimit.remaining);

      const answer =
        response.ok && typeof payload.text === 'string'
          ? payload.text
          : typeof payload.error === 'string'
            ? payload.error
            : 'I could not complete that request.';

      await sendAiMessage(user.uid, threadId, 'assistant', answer);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError') && threadId) {
        await sendAiMessage(user.uid, threadId, 'assistant', 'I could not connect. Please try again.');
      }
    } finally {
      aborter.current = null;
      setBusy(false);
    }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask();
    }
  }

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-background lg:block">
        <History threads={threads} activeId={id} choose={choose} remove={setDeleteTarget} newChat={newChat} />
      </aside>

      <section className="flex min-h-[100dvh] min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/88 px-3 backdrop-blur-3xl">
          <Link href="/home" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="size-5" /></Link>
          <button onClick={() => setHistoryOpen(true)} className="rounded-full p-2 hover:bg-secondary lg:hidden"><Menu className="size-5" /></button>
          <span className="grid size-9 place-items-center rounded-xl border bg-background"><AiMark className="size-6" /></span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black">{active?.title || 'VAYROX AI'}</h1>
            {remaining !== null && <p className="text-[10px] text-muted-foreground">{remaining} requests available</p>}
          </div>
          <button onClick={newChat} className="ml-auto flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold hover:bg-secondary">
            <MessageSquarePlus className="size-4" />New chat
          </button>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-40 pt-6 sm:px-6">
          {loading && !items.length ? (
            <ChatLoader />
          ) : items.length || busy ? (
            <div className="space-y-7">
              {items.map((item) => <Message key={item.id} item={item} copy={copy} />)}
              {busy && (
                <div className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center"><AiMark className="size-6" /></span>
                  <div className="pt-1">
                    <span className="vayxo-loader"><i /><i /><i /></span>
                    <button onClick={stop} className="ml-4 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold">
                      <Square className="size-3" fill="currentColor" />Stop
                    </button>
                  </div>
                </div>
              )}
              <div ref={end} />
            </div>
          ) : (
            <div className="my-auto py-16 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-[22px] border shadow-sm"><AiMark className="size-10" /></span>
              <h2 className="mt-6 text-3xl font-black sm:text-4xl">How can I help?</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Write, brainstorm, understand VAYROX, or work through an idea in one continuous conversation.</p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
                {ideas.map((idea) => <button key={idea} onClick={() => void ask(idea)} className="rounded-2xl border p-4 text-left text-sm hover:bg-secondary">{idea}</button>)}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void ask(); }} className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background to-transparent px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-10 lg:left-[280px]">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end rounded-[28px] border bg-background p-2 shadow-xl">
              <textarea ref={area} rows={1} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={keyDown} disabled={busy} maxLength={4000} placeholder="Message VAYROX AI" className="min-h-12 max-h-44 flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 outline-none disabled:opacity-50" />
              {busy ? (
                <button type="button" onClick={stop} className="grid size-11 place-items-center rounded-full bg-foreground text-background"><Square className="size-4" fill="currentColor" /></button>
              ) : (
                <button disabled={!text.trim()} className="grid size-11 place-items-center rounded-full bg-foreground text-background disabled:opacity-30"><Send className="size-5" /></button>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">VAYROX AI can make mistakes. Check important information.</p>
          </div>
        </form>
      </section>

      <AnimatePresence>
        {historyOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm lg:hidden" onMouseDown={() => setHistoryOpen(false)}>
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} onMouseDown={(event) => event.stopPropagation()} className="h-full w-[86%] max-w-sm bg-background">
              <button onClick={() => setHistoryOpen(false)} className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-secondary"><X className="size-5" /></button>
              <History threads={threads} activeId={id} choose={choose} remove={setDeleteTarget} newChat={newChat} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!deleteTarget} title="Delete conversation?" description={deleteTarget ? `“${deleteTarget.title}” will be permanently removed from your AI history.` : ''} confirmLabel="Delete" danger onCancel={() => setDeleteTarget(null)} onConfirm={remove} />

      <AnimatePresence>
        {notice && <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background shadow-2xl">{notice}</motion.div>}
      </AnimatePresence>
    </main>
  );
}

function Message({ item, copy }: { item: AiMessage; copy: (value: string) => void }) {
  if (item.role === 'user') {
    return <div className="flex justify-end"><div className="group relative max-w-[82%] rounded-[24px] bg-secondary px-5 py-3.5 leading-7"><p className="whitespace-pre-wrap break-words">{item.text}</p><button onClick={() => copy(item.text)} className="absolute -bottom-7 right-1 flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100"><Copy className="size-3" />Copy</button></div></div>;
  }
  return <div className="group flex gap-3"><span className="mt-0.5 grid size-8 shrink-0 place-items-center"><AiMark className="size-6" /></span><div className="min-w-0 flex-1"><p className="whitespace-pre-wrap break-words leading-7">{item.text}</p><button onClick={() => copy(item.text)} className="mt-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-muted-foreground opacity-0 hover:bg-secondary group-hover:opacity-100"><Copy className="size-3" />Copy</button></div></div>;
}

function History({ threads, activeId, choose, remove, newChat }: { threads: AiThread[]; activeId: string; choose: (id: string) => void; remove: (thread: AiThread) => void; newChat: () => void }) {
  return <div className="flex h-full flex-col p-3"><div className="mb-3 flex items-center gap-2 px-2 py-2"><AiMark className="size-7" /><b>VAYROX AI</b></div><button onClick={newChat} className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold hover:bg-secondary"><MessageSquarePlus className="size-4" />New chat</button><div className="mt-4 flex-1 overflow-y-auto"><p className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Chats</p>{threads.length ? threads.map((thread) => <div key={thread.id} className={`group flex items-center rounded-xl ${activeId === thread.id ? 'bg-secondary' : ''}`}><button onClick={() => choose(thread.id)} className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm">{thread.title || 'New chat'}</button><button onClick={() => remove(thread)} className="mr-1 rounded-full p-2 text-muted-foreground opacity-0 hover:bg-background hover:text-red-500 group-hover:opacity-100"><Trash2 className="size-3.5" /></button></div>) : <p className="px-3 py-6 text-sm text-muted-foreground">Your conversations will appear here.</p>}</div></div>;
}

function ChatLoader() {
  return <div className="space-y-8 animate-pulse"><div className="flex gap-3"><div className="size-8 rounded-full bg-secondary" /><div className="h-4 w-3/4 rounded bg-secondary" /></div><div className="ml-auto h-12 w-1/2 rounded-3xl bg-secondary" /><div className="flex gap-3"><div className="size-8 rounded-full bg-secondary" /><div className="flex-1 space-y-3"><div className="h-4 w-11/12 rounded bg-secondary" /><div className="h-4 w-8/12 rounded bg-secondary" /></div></div></div>;
}
