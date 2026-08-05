// Demo-mode scheduler.
// Stands in for Google Calendar freebusy: finds the "soonest shared open slot"
// for both members over the next 14 days, inside sane hours (9am–6pm local).
// Swap `findSoonestSharedSlot` with a real freebusy implementation when
// Google OAuth credentials are configured (see README).

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function findSoonestSharedSlot(seedKey: string): Date {
  const now = new Date();
  const slot = new Date(now);
  slot.setDate(slot.getDate() + 1);
  // skip weekends
  while (slot.getDay() === 0 || slot.getDay() === 6) slot.setDate(slot.getDate() + 1);
  // pick a believable business hour from the seed (9:00–16:30)
  const h = hashString(seedKey);
  slot.setHours(9 + (h % 8), h % 2 === 0 ? 0 : 30, 0, 0);
  return slot;
}

export function formatSlot(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
