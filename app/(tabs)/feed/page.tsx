"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Profile, relationshipLabel, stageDistance } from "@/lib/types";
import { findSoonestSharedSlot } from "@/lib/scheduler";
import MatchModal from "@/components/MatchModal";

type Anim = "" | "anim-left" | "anim-right" | "anim-up";

export default function Feed() {
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);
  const [deck, setDeck] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [anim, setAnim] = useState<Anim>("");
  const [matchWith, setMatchWith] = useState<Profile | null>(null);
  const [matchSlot, setMatchSlot] = useState<Date | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return router.replace("/welcome");
    const uid = session.user.id;

    const [{ data: myProfile }, { data: mySwipes }, { data: profiles }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("swipes").select("target_id").eq("swiper_id", uid),
      sb.from("profiles").select("*").neq("id", uid),
    ]);

    if (!myProfile) return router.replace("/onboarding");
    const swiped = new Set((mySwipes ?? []).map((s) => s.target_id));
    const fresh = (profiles ?? []).filter((p) => !swiped.has(p.id)) as Profile[];
    // matching prioritizes complementary stages (adjacent rungs first)
    fresh.sort(
      (a, b) =>
        Math.abs(stageDistance(myProfile.stage, a.stage) - 1) -
        Math.abs(stageDistance(myProfile.stage, b.stage) - 1)
    );
    setMe(myProfile as Profile);
    setDeck(fresh);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // Start the fetch in a microtask so setState is not synchronous in the effect.
    void Promise.resolve().then(() => { void load(); });
  }, [load]);

  async function swipe(direction: "left" | "right" | "super") {
    if (!me || deck.length === 0 || busyRef.current) return;
    busyRef.current = true;
    const target = deck[0];
    setAnim(direction === "left" ? "anim-left" : direction === "right" ? "anim-right" : "anim-up");

    const sb = supabase();
    await sb.from("swipes").insert({ swiper_id: me.id, target_id: target.id, direction });

    let matched = false;
    if (direction !== "left") {
      const [a, b] = [me.id, target.id].sort();
      const { data: match } = await sb
        .from("matches")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (match) {
        matched = true;
        // Signature feature (demo scheduler): compute soonest shared slot & propose the meeting
        const slot = findSoonestSharedSlot(match.id);
        const { data: existing } = await sb
          .from("meetings")
          .select("id, proposed_slot")
          .eq("match_id", match.id)
          .maybeSingle();
        if (!existing) {
          await sb.from("meetings").insert({ match_id: match.id, proposed_slot: slot.toISOString() });
          setMatchSlot(slot);
        } else {
          setMatchSlot(new Date(existing.proposed_slot));
        }
        setTimeout(() => setMatchWith(target), 380);
      }
    }

    setTimeout(() => {
      setDeck((d) => d.slice(1));
      setAnim("");
      busyRef.current = false;
    }, matched ? 380 : 380);
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-dim">Finding your people…</div>;
  }

  const current = deck[0];
  const upNext = deck[1];

  return (
    <div className="relative flex flex-1 flex-col px-5 py-4">
      {current && me ? (
        <>
          <div className="relative flex-1">
            {upNext && (
              <Card profile={upNext} me={me} className="absolute inset-0 scale-[0.96] opacity-40" />
            )}
            <Card profile={current} me={me} className={`absolute inset-0 ${anim}`} />
          </div>

          <div className="flex items-center justify-center gap-5 pt-5">
            <ActionButton onClick={() => swipe("left")} label="Pass" className="border-line text-dim">
              ✕
            </ActionButton>
            <ActionButton
              onClick={() => swipe("super")}
              label="Super"
              className="border-gold text-gold"
              small
            >
              ★
            </ActionButton>
            <ActionButton onClick={() => swipe("right")} label="Connect" className="border-success text-success">
              ✓
            </ActionButton>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-4xl">⛰️</p>
          <h2 className="text-xl font-semibold">You&apos;ve met everyone on this stretch</h2>
          <p className="max-w-xs text-sm text-dim">
            New members join daily. Check your matches — someone may be waiting on a meeting time.
          </p>
        </div>
      )}

      {matchWith && me && (
        <MatchModal
          me={me}
          them={matchWith}
          slot={matchSlot}
          onClose={() => { setMatchWith(null); setMatchSlot(null); }}
        />
      )}
    </div>
  );
}

function Card({ profile, me, className = "" }: { profile: Profile; me: Profile; className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-card card-shadow ${className}`}>
      <div className="relative flex-1 min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo_url ?? ""}
          alt={profile.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sunrise">
            {relationshipLabel(me.stage, profile.stage)}
          </p>
          <h2 className="pt-0.5 text-2xl font-bold">{profile.name}</h2>
          <p className="pt-0.5 text-sm text-white/90">{profile.headline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        <Tag>{profile.industry}</Tag>
        <Tag gold>{profile.stage}</Tag>
        {profile.open_to.slice(0, 3).map((o) => (
          <Tag key={o}>{o}</Tag>
        ))}
      </div>
    </div>
  );
}

function Tag({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        gold ? "border-gold/60 bg-gold/10 text-gold" : "border-line bg-elev text-dim"
      }`}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  label,
  className = "",
  small = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border-2 bg-elev transition active:scale-90 ${
        small ? "h-12 w-12 text-lg" : "h-16 w-16 text-2xl"
      } ${className}`}
    >
      {children}
    </button>
  );
}
