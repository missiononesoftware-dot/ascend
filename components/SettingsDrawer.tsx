"use client";

import { useEffect, useState } from "react";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 rounded-full transition ${on ? "bg-gold" : "bg-line"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

export default function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [light, setLight] = useState(false);
  const [pushMatches, setPushMatches] = useState(true);
  const [pushMessages, setPushMessages] = useState(true);
  const [pushMeetings, setPushMeetings] = useState(true);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, [open]);

  function setTheme(l: boolean) {
    setLight(l);
    if (l) document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("ascend-theme", l ? "light" : "dark"); } catch {}
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed right-0 top-0 z-40 h-full w-72 border-l border-line bg-elev p-6 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-dim hover:text-ink">✕</button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Light mode</p>
              <p className="text-xs text-dim">Sunrise palette</p>
            </div>
            <Toggle on={light} onChange={setTheme} />
          </div>

          <hr className="border-line" />
          <p className="text-xs font-semibold uppercase tracking-wide text-dim">Notifications</p>

          <div className="flex items-center justify-between">
            <p className="font-medium">New matches</p>
            <Toggle on={pushMatches} onChange={setPushMatches} />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Messages</p>
            <Toggle on={pushMessages} onChange={setPushMessages} />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Meeting updates</p>
            <Toggle on={pushMeetings} onChange={setPushMeetings} />
          </div>
        </div>
      </aside>
    </>
  );
}
