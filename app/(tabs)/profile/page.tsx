"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { INTENTS, Profile, STAGES, Stage } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState("");
  const [stage, setStage] = useState<Stage>("starting");
  const [intents, setIntents] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return router.replace("/welcome");
    const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (!data) return router.replace("/onboarding");
    const p = data as Profile;
    setProfile(p);
    setHeadline(p.headline ?? "");
    setStage(p.stage);
    setIntents(p.open_to);
  }, [router]);

  useEffect(() => {
    // Start the fetch in a microtask so setState is not synchronous in the effect.
    void Promise.resolve().then(() => { void load(); });
  }, [load]);

  async function save() {
    if (!profile) return;
    await supabase()
      .from("profiles")
      .update({ headline: headline.trim(), stage, open_to: intents })
      .eq("id", profile.id);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  }

  async function signOut() {
    await supabase().auth.signOut();
    router.replace("/welcome");
  }

  if (!profile) return <div className="flex flex-1 items-center justify-center text-dim">Loading…</div>;

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo_url ?? ""}
          alt={profile.name}
          className="h-28 w-28 rounded-full border-2 border-gold object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-dim">{profile.industry}</p>
        </div>
        {saved && <p className="text-sm text-success">Saved ✓</p>}
      </div>

      {!editing ? (
        <>
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-dim">Building</p>
            <p className="pt-1">{profile.headline}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-dim">Stage</p>
            <p className="pt-1 font-semibold capitalize text-gold">{profile.stage}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-dim">Open to</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.open_to.map((o) => (
                <span key={o} className="rounded-full border border-line bg-elev px-3 py-1 text-xs capitalize text-dim">
                  {o}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-line py-3 font-medium hover:border-gold"
          >
            Edit profile
          </button>
        </>
      ) : (
        <>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            rows={2}
            maxLength={90}
            className="resize-none rounded-xl border border-line bg-elev px-4 py-3 outline-none focus:border-gold"
          />
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStage(s.key)}
                className={`rounded-full border px-4 py-2 text-sm capitalize ${
                  stage === s.key ? "border-gold bg-gold text-goldink" : "border-line bg-elev"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((i) => {
              const on = intents.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => setIntents(on ? intents.filter((x) => x !== i) : [...intents, i])}
                  className={`rounded-full border px-4 py-2 text-sm capitalize ${
                    on ? "border-gold bg-gold text-goldink" : "border-line bg-elev"
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-line py-3 text-dim">
              Cancel
            </button>
            <button onClick={save} className="flex-1 rounded-xl bg-gold py-3 font-semibold text-goldink">
              Save
            </button>
          </div>
        </>
      )}

      <button onClick={signOut} className="mt-auto pb-2 text-sm text-dim underline-offset-4 hover:underline">
        Sign out
      </button>
    </div>
  );
}
