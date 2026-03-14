# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A family chores PWA for kids and parents. Kids complete daily chores, earn treasure chest rewards, and track streaks/points.

## Tech Stack
- **Next.js 15** (App Router, TypeScript, React Compiler enabled)
- **Convex** — real-time reactive database + backend functions
- **Tailwind CSS v4** (PostCSS integration, no separate tailwind.config)
- **Framer Motion** — animations
- **canvas-confetti** — celebration effects
- **Google Fonts**: Knewave (headings, `font-knewave`), Funnel Display (`font-funnel`)

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
Schema tables: `users`, `chores`, `completions`, `rewards`, `treasureOpens`, `settings`.

Key relationships:
- `completions` indexed by `(userId, date)` — date is always passed from the **client** as `new Date().toLocaleDateString("en-CA")` to avoid UTC timezone mismatch
- `chores.assignedTo` — optional array of user IDs; if absent, chore shows for all kids
- `chores.scheduleType`: `"floating"` (shows every weekday) or `"repeating"` (filtered by `daysOfWeek`)
- `todayDow` (day-of-week 0–6) is always passed from the client for the same timezone reason
- Chores never show on weekends (dow 0 or 6) — enforced in `listForKid` and `getKidsSummary`

### Key Business Rules
- Treasure chest unlocks when `remaining.length === 0 && completed.length > 0` — all visible chores handled (completed or snoozed) with at least one actually completed
- Snoozed ("do later") chores are stored in `localStorage` keyed as `snoozed-${userId}-${today}` — day-scoped, resets automatically each day; floating chores only
- Progress bar reflects `completed / (completed + remaining)` — snoozed chores are excluded from both numerator and denominator
- Each kid can open the chest once per day (`treasureOpens` table)
- Rewards weighted by rarity: common (5×), rare (3×), epic (2×)
- `level = floor(points / 100) + 1`
- Week resets Monday; chores pushed past Friday disappear over the weekend and reappear fresh on Monday

### Chore Card Colors
Fallback chain: `chore.cardColor` → `getPresetByFile(chore.imageUrl)?.color` → `DEFAULT_CARD_COLOR`. `cardColor` is pixel-sampled via Canvas API in `AddChoreDialog` when an image is selected. Presets in `src/lib/chorePresets.ts`.

### Chore Illustrations
Images live in `public/chores/*.png`. The API route reads this directory dynamically — new images appear in the picker without code changes.

### Frontend Patterns
- **KidDashboard card deck**: swipeable stack (max 3 visible). `useDragControls` + imperative `animate()` — card flies off first, Convex mutation fires after ~210ms to prevent spring-back. Double-tap detected via `onPointerDown` timestamp diff (< 350ms). Single-card decks spring back on swipe instead of cycling.
- **KidDashboard layout**: `bg-olive-950` header slides in from top; `bg-olive-300` page background. When chores remain, an `absolute h-[479px]` dark background extends behind the card deck. When no chores remain the absolute bg is hidden and the header shrinks to natural height.
- **Reward button**: `fixed bottom-0` — always visible once chest is unlocked, slides in from bottom.
- **Color scheme**: `bg-olive-950` header/dark, `bg-olive-300` page background, `bg-white` cards with `border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09]`. Consistent across KidDashboard, UserSelector, AdminDashboard.
- **Admin**: PIN stored in `settings` table under key `"adminPin"`. Single "Parents" button (uses `admins[0]`). `PinPad` has no `adminName` — all admins share the same PIN.
- **Animations**: entry springs use `stiffness: 400, damping: 28` throughout. Header slides from `y: -24`, bottom elements from `y: 24`.
- `AdminDashboard` uses Lucide icons throughout. `ChoreAvatar` renders image thumbnail or dynamic Lucide icon by name.

## Deployment
- Frontend: Vercel (`vercel deploy`)
- Backend: Convex cloud (`npx convex deploy`)
- Required env var: `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
