"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return router.replace("/welcome");
      const { data: profile } = await sb
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();
      router.replace(profile ? "/feed" : "/onboarding");
    })();
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="glow-pulse rounded-full p-4">
        <Logo size={56} />
      </div>
    </main>
  );
}
