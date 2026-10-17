"use client";

import { FormEvent, ReactNode, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

type AdminSession = { authenticated: boolean };

async function fetchSession(url: string): Promise<AdminSession> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to verify admin session");
  return response.json();
}

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, error, mutate } = useSWR<AdminSession>("/api/admin/session", fetchSession, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Unable to sign in.");
        return;
      }

      await mutate({ authenticated: true }, { revalidate: false });
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
      router.replace(nextPath);
      router.refresh();
    } catch {
      setMessage("Could not reach the sign-in service. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (data?.authenticated) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-2xl sm:p-9">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-300">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-300">The SUN · Admin</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Sign in to continue</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in with the admin email and password configured for this deployment. Your credentials are
          exchanged for a short-lived, HttpOnly session and are never stored in the browser.
        </p>

        {data === undefined && !error ? (
          <p className="mt-8 text-sm text-muted-foreground" role="status">Checking your session…</p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-foreground" htmlFor="admin-email">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
              <input
                autoComplete="username"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                id="admin-email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter admin email"
                required
                type="email"
                value={email}
              />
            </div>
            <label className="block text-sm font-medium text-foreground" htmlFor="admin-password">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
              <KeyRound aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoComplete="current-password"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                id="admin-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                required
                type="password"
                value={password}
              />
            </div>
            {(message || error) && (
              <p className="text-sm text-destructive" role="alert">
                {message || "Could not verify the current session. Check the deployment configuration and retry."}
              </p>
            )}
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !email || !password}
              type="submit"
            >
              <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
              {!isSubmitting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
