"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Match, Meeting, Profile } from "@/lib/types";
import { formatSlot } from "@/lib/scheduler";

interface Row {
  meeting: Meeting;
  match: Match;
  other: Profile;
  iAmA: boolean;
}

export default function Meetings() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [justBooked, setJustBooked] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return router.replace("/welcome");
    const myId = session.user.id;
    setUid(myId);

    const { data: matches } = await sb.from("matches").select("*");
    const matchList = (matches ?? []) as Match[];
    if (matchList.length === 0) { setRows([]); setLoading(false); return; }

    const otherIds = matchList.map((m) => (m.user_a === myId ? m.user_b : m.user_a));
    const [{ data: meetings }, { data: profiles }] = await Promise.all([
      sb.from("meetings").select("*").in("match_id", matchList.map((m) => m.id)),
      sb.from("profiles").select("*").in("id", otherIds),
    ]);

    const profMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
    const built: Row[] = (meetings ?? [])
      .map((mt: Meeting) => {
        const match = matchList.find((m) => m.id === mt.match_id)!;
        const otherId = match.user_a === myId ? match.user_b : match.user_a;
        const other = profMap.get(otherId);
        if (!other) return null;
        return { meeting: mt, match, other, iAmA: match.user_a === myId };
      })
      .filter(Boolean) as Row[];

    built.sort((a, b) => new Date(a.meeting.proposed_slot).getTime() - new Date(b.meeting.proposed_slot).getTime());
    setRows(built);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function approve(row: Row) {
    const sb = supabase();
    const myFlag = row.iAmA ? "user_a_approved" : "user_b_approved";
    const otherApproved = row.iAmA ? row.meeting.user_b_approved : row.meeting.user_a_approved;

    const update: Record<string, unknown> = { [myFlag]: true };
    if (otherApproved) {
      // Both approved → book it. (Demo mode: simulates Google Calendar event creation
      // with a Meet link — swap for real Calendar API insert when OAuth is configured.)
      update.status = "confirmed";
      update.google_event_id = `demo-${row.meeting.id.slice(0, 8)}`;
    }
    await sb.from("meetings").update(update).eq("id", row.meeting.id);
    if (otherApproved) setJustBooked(row.meeting.id);
    load();
  }

  async function decline(row: Row) {
    await supabase().from("meetings").update({ status: "declined" }).eq("id", row.meeting.id);
    load();
  }

  if (loading) return <div className="flex flex-1 items-center justify-center text-dim">Loading meetings…</div>;

  const proposed = rows.filter((r) => r.meeting.status === "proposed");
  const confirmed = rows.filter((r) => r.meeting.status === "confirmed");

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-5">
      <section>
        <h2 className="pb-3 text-sm font-semibold uppercase tracking-wide text-dim">
          Needs your approval
        </h2>
        {proposed.length === 0 ? (
          <p className="rounded-xl border border-line bg-elev p-4 text-sm text-dim">
            Nothing pending. Match with someone and Ascend will propose a time.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {proposed.map((r) => {
              const mine = r.iAmA ? r.meeting.user_a_approved : r.meeting.user_b_approved;
              const theirs = r.iAmA ? r.meeting.user_b_approved : r.meeting.user_a_approved;
              return (
                <div key={r.meeting.id} className="rise-in rounded-xl border border-line bg-card p-4">
                  <PersonLine profile={r.other} />
                  <p className="pt-2 font-semibold text-gold">{formatSlot(r.meeting.proposed_slot)}</p>
                  <p className="pt-0.5 text-xs text-dim">
                    Soonest slot you&apos;re both free ·{" "}
                    {theirs ? `${r.other.name.split(" ")[0]} already approved` : `waiting on both of you`}
                  </p>
                  <div className="flex gap-2.5 pt-3">
                    {mine ? (
                      <span className="flex-1 rounded-lg border border-success/50 py-2.5 text-center text-sm font-medium text-success">
                        You approved — waiting on {r.other.name.split(" ")[0]}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => decline(r)}
                          className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-dim"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => approve(r)}
                          className="flex-[2] rounded-lg bg-gold py-2.5 text-sm font-semibold text-goldink"
                        >
                          Approve {theirs ? "& book it" : "time"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="pb-3 text-sm font-semibold uppercase tracking-wide text-dim">Booked</h2>
        {confirmed.length === 0 ? (
          <p className="rounded-xl border border-line bg-elev p-4 text-sm text-dim">
            Approved meetings land here — and on both calendars.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {confirmed.map((r) => (
              <div
                key={r.meeting.id}
                className={`rounded-xl border p-4 ${
                  justBooked === r.meeting.id ? "rise-in border-gold/60 bg-gold/10" : "border-line bg-card"
                }`}
              >
                <PersonLine profile={r.other} />
                <p className="pt-2 font-semibold">{formatSlot(r.meeting.proposed_slot)}</p>
                <p className="pt-1 text-xs text-success">
                  ✓ Booked — added to both calendars with a Meet link
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PersonLine({ profile }: { profile: Profile }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={profile.photo_url ?? ""} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
      <div>
        <p className="font-semibold leading-tight">{profile.name}</p>
        <p className="text-xs text-dim">{profile.headline}</p>
      </div>
    </div>
  );
}
