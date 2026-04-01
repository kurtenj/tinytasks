# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A family chores PWA for kids and parents. Kids complete daily chores and track weekly progress toward an allowance.

## Tech Stack
- **Next.js 15** (App Router, TypeScript, React Compiler enabled)
- **Convex** — real-time reactive database + backend functions
- **Tailwind CSS v4** (PostCSS integration, no separate tailwind.config)
- **Framer Motion** — animations
- **Google Fonts**: Geist (`font-sans`), Outfit (`font-google-sans`)

## Commands

```bash
npm run dev        # Start Next.js dev server
npx convex dev     # Start Convex backend (run in parallel with dev)
npm run build      # Production build
npm run lint       # ESLint
npx convex deploy  # Deploy Convex backend to cloud
```

Both `npm run dev` and `npx convex dev` must run simultaneously during development. Convex auto-generates `convex/_generated/` — never edit those files.

## Architecture

### Data Flow
`page.tsx` → `UserSelector` → `KidDashboard` or `AdminDashboard`. All data fetching uses Convex reactive queries (`useQuery`) and mutations (`useMutation`). No API routes except `GET /api/chore-images` which reads `public/chores/` at runtime.

### Convex Backend (`/convex`)
Schema tables: `users`, `chores`, `completions`, `snoozed`, `settings`.

Key relationships:
- `completions` indexed by `(userId, date)` — date is always passed from the **client** as `new Date().toLocaleDateString("en-CA")` to avoid UTC timezone mismatch
- `snoozed` indexed by `(userId, date)` and `(date)` — same date convention
- `chores.assignedTo` — optional array of user IDs; if absent, chore shows for all kids
- `chores.scheduleType`: `"floating"` (shows every weekday) or `"repeating"` (filtered by `daysOfWeek`)
- `todayDow` (day-of-week 0–6) is always passed from the client for the same timezone reason
- Chores never show on weekends (dow 0 or 6) — enforced in `listForKid` and `getKidsSummary`
- `settings` is a key-value store; known keys: `"adminPin"`, `"allowanceAmount"`

### Key Business Rules
- Snoozed ("do later") chores are stored server-side in the `snoozed` table (`userId`, `choreId`, `date`) — synced across all devices in real-time; day-scoped; floating chores only (not repeating, not on Friday)
- Progress bar reflects `completed / (completed + remaining)` — snoozed chores are excluded from both numerator and denominator
- Allowance status (`getWeeklyAllowanceStatus`): returns `"earned"` | `"lost"` | `"on_track"`. Scheduled (repeating) chores must be done on their assigned day; floating chores must be done at least once during the week. Missing a required day = `"lost"` immediately.
- Week resets Monday; chores pushed past Friday disappear over the weekend and reappear fresh on Monday
- `complete` and `snoozeChore` mutations are idempotent (check for existing record before inserting)

### Time Helpers (`src/lib/time.ts`)
- `getToday()` — returns `new Date().toLocaleDateString("en-CA")` (YYYY-MM-DD, client timezone). Use this everywhere a date string is needed.
- `useLiveClock()` — formatted day + time label, updates every 10s
- `useChoreCountdown(scheduleType)` — countdown to Friday 23:59 (floating) or end of day (repeating), updates every 60s

### Chore Card Colors
Fallback chain: `chore.cardColor` → `getPresetByFile(chore.imageUrl)?.color` → `DEFAULT_CARD_COLOR`. `cardColor` is pixel-sampled via Canvas API in `AddChoreDialog` when an image is selected. Presets in `src/lib/chorePresets.ts`.

### Chore Illustrations
Images live in `public/chores/*.png`. The API route reads this directory dynamically — new images appear in the picker without code changes.

### Frontend Patterns
- **KidDashboard card deck**: swipeable stack (max 3 visible). `useDragControls` + imperative `animate()` — card flies off first, Convex mutation fires after ~210ms to prevent spring-back. Double-tap detected via `onPointerDown` timestamp diff (< 350ms). Single-card decks spring back on swipe instead of cycling.
- **KidDashboard layout**: `bg-olive-200` header; `bg-neutral-100` page background. When chores remain, an absolute olive background extends behind the card deck. When no chores remain, the absolute bg is hidden and the header shrinks to natural height.
- **Color scheme**: Header/accents use `bg-olive-200` / `text-olive-500`. Cards are `bg-white` with `border border-neutral-600 shadow-lg`. Page background is `bg-neutral-100` — consistent across KidDashboard, UserSelector, AdminDashboard. CSS `--background` is set to match.
- **Admin**: PIN stored in `settings` table under key `"adminPin"`. Single "Parents" button (uses `admins[0]`). `PinPad` has no `adminName` — all admins share the same PIN.
- **Animations**: entry springs use `stiffness: 400, damping: 28` throughout. Header slides from `y: -24`, bottom elements from `y: 24`.
- `AdminDashboard` uses Lucide icons throughout. `ChoreAvatar` renders image thumbnail or dynamic Lucide icon by name.
- `src/app/preview/page.tsx` — interactive animation/layout preview for dev use only.

### PWA Configuration
- **Manifest**: `public/manifest.json` — `theme_color` and `background_color` are `#f5f5f5` (neutral-100). Icons declared with separate `"any"` and `"maskable"` purpose entries for each size.
- **Viewport**: `viewportFit: "cover"` in `layout.tsx` ensures content fills behind the iOS status bar. `statusBarStyle: "black-translucent"` makes the status bar transparent.
- **Assets**: `public/icon.png` (favicon), `public/apple-touch-icon.png` (180×180 for iOS), `public/icon-192.png`, `public/icon-512.png`.

## Deployment
- Frontend: Vercel (git-based deploy, set `NEXT_PUBLIC_CONVEX_URL` in dashboard)
- Backend: Convex cloud (`npx convex deploy`)
- Required env var: `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
