"use client";

import { useState } from "react";
import TabBar from "@/components/TabBar";
import SettingsDrawer from "@/components/SettingsDrawer";
import Logo from "@/components/Logo";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-elev/95 px-5 py-3 backdrop-blur">
        <Logo size={28} withWord />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Settings"
          className="flex flex-col gap-[5px] p-2"
        >
          <span className="h-0.5 w-5 rounded bg-ink" />
          <span className="h-0.5 w-5 rounded bg-ink" />
          <span className="h-0.5 w-5 rounded bg-ink" />
        </button>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <TabBar />
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
