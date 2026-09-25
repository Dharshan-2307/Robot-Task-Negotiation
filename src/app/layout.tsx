import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriSwarm — Decentralized Multi-Robot Farm Utility & Emergency Response",
  description: "Mission Control Dashboard for autonomous multi-robot poultry farm utility monitoring, peer-to-peer negotiation, and emergency response.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100">{children}</body>
    </html>
  );
}
