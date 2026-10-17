import type { Metadata } from "next";
import { ReactNode } from "react";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminAccessGate } from "@/components/AdminAccessGate";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "The SUN — Token Emulator | One /v1 Endpoint, 7.4 Billion Free Tokens / Month",
  description:
    "The SUN is an OpenAI-compatible AI gateway with smart model routing, provider key management, and an authenticated admin dashboard.",
  keywords: [
    "The SUN",
    "Token Emulator",
    "OpenAI compatible API",
    "Admin authentication",
    "Groq",
    "Cerebras",
    "Gemini",
    "Mistral",
    "Free AI tokens",
    "AI Gateway",
    "Smart Routing",
    "LLM Proxy",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark bg-background ${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-gold-500/30 selection:text-gold-200 flex flex-col justify-between">
        <AdminAccessGate>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AdminAccessGate>
      </body>
    </html>
  );
}
