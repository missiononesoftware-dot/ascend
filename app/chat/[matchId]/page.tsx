"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Match, Message, Profile } from "@/lib/types";

export default function Chat() {
  const router = useRouter();
  const { matchId } = useParams<{ matchId: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [other, setOther] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return router.replace("/welcome");
    const myId = session.user.id;
    setUid(myId);

    const { data: match } = await sb.from("matches").select("*").eq("id", matchId).maybeSingle();
    if (!match) return router.replace("/messages");
    const m = match as Match;
    const otherId = m.user_a === myId ? m.user_b : m.user_a;
    const [{ data: prof }, { data: msgs }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", otherId).maybeSingle(),
      sb.from("messages").select("*").eq("match_id", matchId).order("created_at"),
    ]);
    setOther(prof as Profile);
    setMessages((msgs ?? []) as Message[]);
  }, [matchId, router]);

  useEffect(() => {
    // Start the fetch in a microtask so setState is not synchronous in the effect.
    void Promise.resolve().then(() => { void load(); });
  }, [load]);

  // Supabase Realtime: live 1:1 channel per match
  useEffect(() => {
    const sb = supabase();
    const channel = sb
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((cur) => (cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]));
        }
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !uid) return;
    setDraft("");
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      match_id: matchId,
      sender_id: uid,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((cur) => [...cur, optimistic]);
    const { data } = await supabase()
      .from("messages")
      .insert({ match_id: matchId, sender_id: uid, body })
      .select()
      .single();
    if (data) {
      setMessages((cur) => cur.map((m) => (m.id === optimistic.id ? (data as Message) : m)));
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-elev/95 px-4 py-3 backdrop-blur">
        <Link href="/messages" className="p-1 text-dim hover:text-ink" aria-label="Back">
          ←
        </Link>
        {other && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={other.photo_url ?? ""} alt={other.name} className="h-9 w-9 rounded-full object-cover" />
            <div>
              <p className="font-semibold leading-tight">{other.name}</p>
              <p className="text-xs text-dim">{other.headline}</p>
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-dim">
            You matched with {other?.name?.split(" ")[0] ?? "them"}. Break the ice — your meeting is
            already on the books.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === uid;
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] ${
                mine
                  ? "self-end rounded-br-md bg-gold text-goldink"
                  : "self-start rounded-bl-md border border-line bg-card"
              }`}
            >
              {m.body}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 flex gap-2.5 border-t border-line bg-elev p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full border border-line bg-bg px-4 py-2.5 outline-none placeholder:text-dim focus:border-gold"
        />
        <button
          disabled={!draft.trim()}
          className="rounded-full bg-gold px-5 font-semibold text-goldink disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
