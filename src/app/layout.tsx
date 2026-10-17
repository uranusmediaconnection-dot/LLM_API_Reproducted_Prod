import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "FreeLLMAPI - 7.4 Billion Free Tokens / Month behind One /v1 Endpoint",
  description:
    "Aggregate free tiers from 34 AI providers (Groq, Cerebras, Google Gemini, Mistral, OpenRouter). One OpenAI-compatible endpoint with smart routing, automatic failover, and encrypted keys.",
  keywords: [
    "Free LLM API",
    "OpenAI compatible API",
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07090e] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
