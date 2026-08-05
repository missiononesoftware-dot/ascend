"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import { INTENTS, STAGES, Stage } from "@/lib/types";

const AVATARS = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/65.jpg",
  "https://randomuser.me/api/portraits/men/11.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/men/53.jpg",
  "https://randomuser.me/api/portraits/women/26.jpg",
  "https://randomuser.me/api/portraits/men/85.jpg",
  "https://randomuser.me/api/portraits/women/50.jpg",
];

const INDUSTRIES = [
  "Home Services", "SaaS", "E-commerce", "Food & Beverage", "Real Estate",
  "Agency / Marketing", "Construction", "Health & Fitness", "Faith & Nonprofit",
  "Investing", "Other",
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [intents, setIntents] = useState<string[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    supabase().auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/welcome");
      else {
        const guess = session.user.email?.split("@")[0] ?? "";
        setName((n) => n || guess.charAt(0).toUpperCase() + guess.slice(1));
      }
    });
  }, [router]);

  const steps = useMemo(
    () => [
      { title: "Let's put a face to the name", valid: !!photo && name.trim().length > 1 },
      { title: "What are you building?", valid: headline.trim().length > 2 },
      { title: "What world are you in?", valid: !!industry },
      { title: "Where are you right now?", valid: !!stage },
      { title: "What are you here for?", valid: intents.length > 0 },
      { title: "Let's make the meetings actually happen", valid: true },
    ],
    [photo, name, headline, industry, stage, intents]
  );

  async function finish() {
    setBusy(true);
    setError(null);
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return router.replace("/welcome");
    const { error } = await sb.from("profiles").insert({
      id: session.user.id,
      name: name.trim(),
      photo_url: photo,
      headline: headline.trim(),
      industry,
      stage,
      open_to: intents,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace("/feed?fresh=1");
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <div className="flex items-center justify-between pb-6">
        <Logo size={30} />
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i <= step ? "w-6 bg-gold" : "w-3 bg-line"}`}
            />
          ))}
        </div>
      </div>

      <h1 key={step} className="rise-in pb-6 text-2xl font-bold leading-snug">
        {steps[step].title}
      </h1>

      <div key={`body-${step}`} className="rise-in flex-1" style={{ animationDelay: "0.05s" }}>
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-line bg-elev px-4 py-3.5 outline-none placeholder:text-dim focus:border-gold"
            />
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setPhoto(a)}
                  className={`overflow-hidden rounded-full border-2 transition ${photo === a ? "border-gold scale-105" : "border-transparent opacity-80"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="avatar option" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-xs text-dim">Pick a photo for now — you can change it anytime.</p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              rows={3}
              maxLength={90}
              placeholder={`e.g. "Scaling a home-services brand across Indiana"`}
              className="resize-none rounded-xl border border-line bg-elev px-4 py-3.5 outline-none placeholder:text-dim focus:border-gold"
            />
            <p className="text-xs text-dim">{90 - headline.length} characters left — one line, make it count.</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-wrap gap-2.5">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  industry === ind ? "border-gold bg-gold text-goldink" : "border-line bg-elev text-ink"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            {[...STAGES].reverse().map((s, i) => {
              const selected = stage === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  style={{ marginLeft: `${(3 - i) * 0}px`, marginRight: `${i * 18}px` }}
                  className={`rounded-xl border px-4 py-3.5 text-left transition ${
                    selected ? "border-gold bg-gold/10" : "border-line bg-elev"
                  }`}
                >
                  <span className={`font-semibold ${selected ? "text-gold" : ""}`}>{s.label}</span>
                  <span className="block text-sm text-dim">{s.blurb}</span>
                </button>
              );
            })}
            <p className="text-center text-xs text-dim">Rungs on the mountain — established at the summit.</p>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-wrap gap-2.5">
            {INTENTS.map((intent) => {
              const on = intents.includes(intent);
              return (
                <button
                  key={intent}
                  onClick={() =>
                    setIntents(on ? intents.filter((x) => x !== intent) : [...intents, intent])
                  }
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium capitalize transition ${
                    on ? "border-gold bg-gold text-goldink" : "border-line bg-elev text-ink"
                  }`}
                >
                  {intent}
                </button>
              );
            })}
            <p className="w-full pt-2 text-xs text-dim">Pick as many as apply.</p>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center gap-6 pt-4 text-center">
            <p className="text-dim">
              When you match, Ascend finds the soonest time you&apos;re both free and books it.
              No back-and-forth.
            </p>
            <button
              onClick={() => setCalendarConnected(true)}
              disabled={calendarConnected}
              className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 font-medium transition ${
                calendarConnected ? "border-success text-success" : "border-line bg-elev hover:border-gold"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {calendarConnected ? "Google Calendar connected ✓" : "Connect Google Calendar"}
            </button>
            {!calendarConnected && (
              <button onClick={next} className="text-sm text-dim underline-offset-4 hover:underline">
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="pb-3 text-sm text-danger">{error}</p>}

      <button
        onClick={next}
        disabled={!steps[step].valid || busy}
        className="rounded-xl bg-gold py-3.5 font-semibold text-goldink transition active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? "Setting up…" : step === steps.length - 1 ? "Start climbing" : "Continue"}
      </button>
    </main>
  );
}
