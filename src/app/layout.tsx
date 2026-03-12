import type { Metadata, Viewport } from "next";
import { Geist, Knewave, Funnel_Display } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const knewave = Knewave({ subsets: ["latin"], weight: "400", variable: "--font-knewave" });
const funnelDisplay = Funnel_Display({ subsets: ["latin"], variable: "--font-funnel" });

export const metadata: Metadata = {
  title: "Tiny Tasks",
  description: "Family chores app — earn your treasure!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiny Tasks",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${knewave.variable} ${funnelDisplay.variable} antialiased`}>
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
