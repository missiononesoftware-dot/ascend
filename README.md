# Ascend

**Connect with the right person at the right phase.** A "Tinder for business" networking app —
matches are organized by stage of growth, and on a match, Ascend finds the soonest time both
members are free and books the meeting.

- Someone one step ahead = a mentor
- Someone at your level = a peer to build with
- Someone a step behind = someone you can pour into

## Stack

- **Frontend:** Next.js (App Router) + Tailwind CSS, deployed on **Vercel**
- **Backend:** **Supabase** — Postgres, Auth, Row Level Security, Realtime messaging
- **Design tokens:** midnight navy base, warm gold / sunrise accent (light + dark mode)

## Running locally

```bash
npm install
cp .env.example .env.local   # already contains the project URL + publishable key
npm run dev
```

## Demo accounts

All seeded accounts use the password `Ascend2026!`:

| Email | Purpose |
| --- | --- |
| `hunter@ascend.demo` | Fresh account with **no profile** — walks through the full onboarding flow |
| `sarah@ascend.demo` … `james@ascend.demo` | Seeded members that appear in the feed |

Four seeded members (Sarah, Marcus, Rachel, James) have already right-swiped every new
profile, so swiping right on them triggers an **instant match + meeting proposal** — perfect
for demos.

## Calendar matchmaking (demo mode)

The signature feature — "on a match, read both calendars, find the soonest shared open
slot, both approve, and it books automatically" — currently runs in **demo mode**:
`lib/scheduler.ts` simulates the Google `freebusy` lookup and proposes a believable
business-hours slot; approving from both sides "books" the meeting.

To switch to the real Google Calendar API:

1. Create a Google Cloud project, enable the Calendar API, and configure an OAuth consent
   screen with the `calendar.events` and `freebusy` scopes.
2. Add the OAuth client ID/secret as env vars and store refresh tokens per user
   (`profiles.google_refresh_token` is already in the schema).
3. Replace `findSoonestSharedSlot` with a real freebusy query, and the approval handler in
   `app/(tabs)/meetings/page.tsx` with a Calendar `events.insert` (with a Meet link) for
   both attendees.

## Database

Schema lives in Supabase migrations: `profiles`, `swipes`, `matches`, `meetings`,
`messages`, with RLS on every table. A database trigger creates a match automatically when
a right/super swipe is reciprocated; messaging is live via Supabase Realtime.
