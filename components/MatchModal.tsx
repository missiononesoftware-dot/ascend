"use client";

import { Profile } from "@/lib/types";
import { formatSlot } from "@/lib/scheduler";
import Link from "next/link";

export default function MatchModal({
  me,
  them,
  slot,
  onClose,
}: {
  me: Profile;
  them: Profile;
  slot: Date | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="rise-in w-full max-w-sm rounded-2xl border border-gold/40 bg-card p-6 text-center card-shadow">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Divine timing</p>
        <h2 className="pt-1 text-3xl font-bold">It&apos;s a match</h2>

        <div className="flex items-center justify-center gap-[-8px] py-6">
          {/* eslint-disable @next/next/no-img-element */}
          <img
            src={me.photo_url ?? ""}
            alt={me.name}
            className="h-20 w-20 rounded-full border-2 border-gold object-cover"
          />
          <div className="z-10 -mx-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-goldink font-bold">
            ⛰
          </div>
          <img
            src={them.photo_url ?? ""}
            alt={them.name}
            className="h-20 w-20 rounded-full border-2 border-gold object-cover"
          />
          {/* eslint-enable @next/next/no-img-element */}
        </div>

        <p className="text-dim">
          You and <span className="font-semibold text-ink">{them.name}</span> both want to connect.
        </p>

        {slot && (
          <div className="mt-4 rounded-xl border border-line bg-elev p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-dim">
              Soonest you&apos;re both free
            </p>
            <p className="pt-1 font-semibold text-gold">{formatSlot(slot)}</p>
            <p className="pt-1 text-xs text-dim">
              Meeting proposed — you&apos;ll both approve it before anything lands on a calendar.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-3 font-medium text-dim hover:text-ink"
          >
            Keep swiping
          </button>
          <Link
            href="/meetings"
            className="flex-1 rounded-xl bg-gold py-3 font-semibold text-goldink"
          >
            View meeting
          </Link>
        </div>
      </div>
    </div>
  );
}
