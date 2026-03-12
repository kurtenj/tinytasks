# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A family chores PWA for kids (ages 3, 11, 15) and parents. Kids complete daily chores, earn treasure chest rewards, and track streaks/points.

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
`page.tsx` → user selector → `KidDashboard` or `AdminDashboard`. All data fetching uses Convex reactive queries (`useQuery`) and mutations (`useMutation`) from `convex/react`. No API routes except `GET /api/chore-images` which reads `public/chores/` at runtime to list available illustration files.

### Convex Backend (`/convex`)
Schema tables: `users`, `chores`, `completions`, `rewards`, `treasureOpens`, `settings`.

Key relationships:
- `completions` links `choreId` → `chores` and `userId` → `users`, indexed by `(userId, date)` for daily queries
- `chores.assignedTo` is an optional array of user IDs — if absent, chore shows for all kids
- `chores.scheduleType`: `"floating"` (always shows) or `"repeating"` (filtered by `daysOfWeek`; day-of-week comes from the **client** via `todayDow` arg to avoid UTC timezone mismatch)

### Chore Card Colors
`chores.cardColor` stores a pixel-sampled background color (extracted via Canvas API in `AddChoreDialog` when an image is selected). Fallback chain: `chore.cardColor` → `getPresetByFile(chore.imageUrl)?.color` → `DEFAULT_CARD_COLOR`. Presets are defined in `src/lib/chorePresets.ts`.

### Chore Illustrations
Images live in `public/chores/*.png`. The `GET /api/chore-images` route reads this directory dynamically, so new images appear in the picker without code changes. `src/lib/chorePresets.ts` maps known filenames to metadata (label, preset color, Lucide icon name).

### Key Business Rules
- Kids need **2 chores completed** to unlock the treasure chest
- Each kid can open the chest **once per day**
- Rewards are weighted by rarity: common (5×), rare (3×), epic (2×)
- `level = floor(points / 100) + 1`

### Frontend Patterns
- `KidDashboard` shows chores as a swipeable card deck (capped at 3 visible cards). Cards use `useDragControls` + imperative `animate()` from Framer Motion — the card flies off screen first, then the Convex mutation fires after ~210ms to prevent spring-back artifacts.
- `AdminDashboard` uses Lucide icons throughout (no emojis). `ChoreAvatar` renders either an image thumbnail or a dynamic Lucide icon by name.
- Admin is protected by a PIN pad (`PinPad.tsx`). PIN is stored in the `settings` table under key `"adminPin"`.
- `ConvexClientProvider` shows a setup UI if `NEXT_PUBLIC_CONVEX_URL` is not configured.

## Deployment
- Frontend: Vercel (`vercel deploy`)
- Backend: Convex cloud (`npx convex deploy`)
- Required env var: `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
