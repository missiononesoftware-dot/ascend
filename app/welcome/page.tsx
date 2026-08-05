"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function Welcome() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const sb = supabase();
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
      } else {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace("/onboarding");
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <div className="rise-in flex flex-col items-center gap-3 pb-10 text-center">
        <Logo size={72} />
        <h1 className="text-4xl font-bold tracking-tight">Ascend</h1>
        <p className="max-w-xs text-dim">
          The right person, at the right phase, changes everything.
        </p>
      </div>

      <form onSubmit={submit} className="rise-in flex flex-col gap-3" style={{ animationDelay: "0.1s" }}>
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-line bg-elev px-4 py-3.5 outline-none placeholder:text-dim focus:border-gold"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-line bg-elev px-4 py-3.5 outline-none placeholder:text-dim focus:border-gold"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {notice && <p className="text-sm text-success">{notice}</p>}
        <button
          disabled={busy}
          className="mt-1 rounded-xl bg-gold py-3.5 font-semibold text-goldink transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
        className="mt-6 text-sm text-dim underline-offset-4 hover:underline"
      >
        {mode === "signin" ? "New here? Create an account" : "Already climbing? Sign in"}
      </button>
    </main>
  );
}
