# Tiny Tasks

A family chores PWA for kids and parents. Kids swipe through daily chores, earn points, and unlock a treasure chest with randomized rewards. Parents manage chores, rewards, and track progress from an admin dashboard.

## Stack

- **Next.js 15** — App Router, TypeScript, React Compiler
- **Convex** — real-time reactive backend + database
- **Tailwind CSS v4** — styling
- **Framer Motion** — animations
- **canvas-confetti** — celebration effects

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will prompt you to log in and create a Convex project on first run, then generate `convex/_generated/` and print your deployment URL.

### 3. Configure environment

Create `.env.local` and add your Convex URL:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 4. Run the dev server

In a separate terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Both terminals need to stay running.

## Other Commands

```bash
npm run build      # Production build
npm run lint       # ESLint
npx convex deploy  # Deploy backend to Convex cloud
vercel deploy      # Deploy frontend to Vercel
```

## Adding Chore Illustrations

Drop `.png` files into `public/chores/`. They'll automatically appear in the illustration picker when creating or editing a chore — no code changes needed. The background color for each card is sampled from the image automatically.

## Deployment

- **Frontend**: Vercel — connect the repo and set `NEXT_PUBLIC_CONVEX_URL` as an environment variable
- **Backend**: `npx convex deploy` — deploys Convex functions and schema to the cloud
