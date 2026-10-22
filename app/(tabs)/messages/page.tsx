"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Match, Message, Profile } from "@/lib/types";

interface Thread {
  match: Match;
  other: Profile;
  last: Message | null;
}

export default function Messages() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return router.replace("/welcome");
    const myId = session.user.id;

    const { data: matches } = await sb.from("matches").select("*").eq("status", "active");
    const matchList = (matches ?? []) as Match[];
    if (matchList.length === 0) { setThreads([]); setLoading(false); return; }

    const otherIds = matchList.map((m) => (m.user_a === myId ? m.user_b : m.user_a));
    const [{ data: profiles }, { data: msgs }] = await Promise.all([
      sb.from("profiles").select("*").in("id", otherIds),
      sb
        .from("messages")
        .select("*")
        .in("match_id", matchList.map((m) => m.id))
        .order("created_at", { ascending: false }),
    ]);

    const profMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
    const lastByMatch = new Map<string, Message>();
    for (const m of (msgs ?? []) as Message[]) {
      if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id, m);
    }

    const built = matchList
      .map((match) => {
        const other = profMap.get(match.user_a === myId ? match.user_b : match.user_a);
        if (!other) return null;
        return { match, other, last: lastByMatch.get(match.id) ?? null };
      })
      .filter(Boolean) as Thread[];

    built.sort((a, b) => {
      const ta = a.last ? new Date(a.last.created_at).getTime() : new Date(a.match.created_at).getTime();
      const tb = b.last ? new Date(b.last.created_at).getTime() : new Date(b.match.created_at).getTime();
      return tb - ta;
    });
    setThreads(built);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // Start the fetch in a microtask so setState is not synchronous in the effect.
    void Promise.resolve().then(() => { void load(); });
  }, [load]);

  if (loading) return <div className="flex flex-1 items-center justify-center text-dim">Loading…</div>;

  return (
    <div className="flex flex-1 flex-col px-5 py-5">
      {threads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-4xl">🤝</p>
          <h2 className="text-xl font-semibold">No matches yet</h2>
          <p className="max-w-xs text-sm text-dim">
            Head to the feed and connect — your conversations will live here.
          </p>
          <Link href="/feed" className="mt-2 rounded-xl bg-gold px-6 py-3 font-semibold text-goldink">
            Go to feed
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {threads.map((t) => (
            <Link key={t.match.id} href={`/chat/${t.match.id}`} className="flex items-center gap-3.5 py-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.other.photo_url ?? ""}
                alt={t.other.name}
                className="h-13 w-13 rounded-full object-cover"
                style={{ height: 52, width: 52 }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.other.name}</p>
                <p className="truncate text-sm text-dim">
                  {t.last ? t.last.body : "You matched — say hello 👋"}
                </p>
              </div>
              {!t.last && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
