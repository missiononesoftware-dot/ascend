export type Stage = "starting" | "traction" | "scaling" | "established";

export const STAGES: { key: Stage; label: string; blurb: string }[] = [
  { key: "starting", label: "Starting", blurb: "Just setting out — idea to first customers" },
  { key: "traction", label: "Traction", blurb: "It's working — real customers, real revenue" },
  { key: "scaling", label: "Scaling", blurb: "Pouring fuel on — growing the team & systems" },
  { key: "established", label: "Established", blurb: "Summited before — now building the next thing" },
];

export const INTENTS = ["mentoring", "partnerships", "capital", "peers", "coffee"] as const;
export type Intent = (typeof INTENTS)[number];

export interface Profile {
  id: string;
  name: string;
  photo_url: string | null;
  headline: string | null;
  industry: string | null;
  stage: Stage;
  open_to: string[];
  created_at: string;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  status: "active" | "archived";
  created_at: string;
}

export interface Meeting {
  id: string;
  match_id: string;
  proposed_slot: string;
  user_a_approved: boolean;
  user_b_approved: boolean;
  status: "proposed" | "confirmed" | "declined" | "completed";
  google_event_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function stageDistance(a: Stage, b: Stage): number {
  const order: Stage[] = ["starting", "traction", "scaling", "established"];
  return Math.abs(order.indexOf(a) - order.indexOf(b));
}

export function relationshipLabel(mine: Stage, theirs: Stage): string {
  const order: Stage[] = ["starting", "traction", "scaling", "established"];
  const d = order.indexOf(theirs) - order.indexOf(mine);
  if (d > 0) return "One step ahead — a mentor";
  if (d === 0) return "At your level — a peer to build with";
  return "A step behind — someone to pour into";
}
