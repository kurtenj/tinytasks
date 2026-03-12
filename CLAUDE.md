# Tiny Tasks — CLAUDE.md

## Project Overview
A family chores PWA for kids (ages 3, 11, 15) and parents. Kids complete daily chores, earn treasure chest rewards, and track streaks/points.

## Tech Stack
- **Next.js 15** (App Router, TypeScript)
- **Convex** — real-time reactive database + backend functions
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** — animations
- **canvas-confetti** — celebration effects

## Architecture

### Convex Backend (`/convex`)
- `schema.ts` — database tables: users, chores, completions, rewards, treasureOpens
- `users.ts` — user CRUD, points/streak updates
- `chores.ts` — chore management
- `completions.ts` — daily chore completion tracking
- `rewards.ts` — treasure chest reward pool
- `treasureOpens.ts` — tracks daily chest opens

### Next.js Frontend (`/src`)
- `app/page.tsx` — root: user selector → kid or admin dashboard
- `components/UserSelector.tsx` — pick who you are (kid or parent)
- `components/KidDashboard.tsx` — main kid view: chores + treasure chest
- `components/AdminDashboard.tsx` — admin: manage chores, rewards, view progress
- `components/ChoreItem.tsx` — individual chore with check/uncheck
- `components/TreasureChest.tsx` — animated reward reveal
- `components/AddChoreDialog.tsx` — admin: create new chore
- `components/AddRewardDialog.tsx` — admin: create new reward

## Key Business Rules
- Kids need **2 chores completed** to unlock the treasure chest
- Each kid can open the chest **once per day**
- Rewards are weighted by rarity: common (5x), rare (3x), epic (2x)
- Points accumulate; level = floor(points / 100) + 1

## Dev Setup
```bash
npm run dev       # Start Next.js dev server
npx convex dev    # Start Convex dev (run in parallel)
```

## Convex Setup
1. `npx convex dev` — creates project, generates `convex/_generated/`
2. Add `NEXT_PUBLIC_CONVEX_URL` to `.env.local`
3. Deploy: `npx convex deploy`

## Deployment
- Frontend: Vercel (`vercel deploy`)
- Backend: Convex cloud (automatic with `npx convex deploy`)

## User Preferences
- Mobile-first design, works great on phones
- Fun and delightful for kids (big touch targets, animations, emojis)
- Simple for young kids (age 3+)
- Admin view is clean and efficient
