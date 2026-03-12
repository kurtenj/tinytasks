"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

let convex: ConvexReactClient | null = null;
if (convexUrl) {
  convex = new ConvexReactClient(convexUrl);
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convex) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-600 to-purple-800 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="text-7xl mb-4">⭐</div>
        <h1 className="text-3xl font-bold mb-4">Tiny Tasks</h1>
        <div className="bg-white/20 rounded-2xl p-6 max-w-md">
          <p className="font-semibold text-lg mb-2">Setup Required</p>
          <p className="text-purple-100 text-sm mb-4">
            Connect to your Convex backend to get started.
          </p>
          <ol className="text-left text-sm space-y-2 text-purple-100">
            <li>1. Run <code className="bg-white/20 px-1 rounded">npx convex dev</code> in your terminal</li>
            <li>2. Add <code className="bg-white/20 px-1 rounded">NEXT_PUBLIC_CONVEX_URL</code> to <code className="bg-white/20 px-1 rounded">.env.local</code></li>
            <li>3. Restart the dev server</li>
          </ol>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
