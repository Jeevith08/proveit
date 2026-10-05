import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" && search["redirect"].startsWith("/") ? search["redirect"] : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [
    { title: "Sign in — Prove It" },
    { name: "description", content: "Sign in or create your private Prove It student tracker account." },
    { property: "og:title", content: "Sign in — Prove It" },
    { property: "og:description", content: "Secure access to your private student progress tracker." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect: redirectParam } = Route.useSearch();
  const destination = redirectParam ?? "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (mode !== "forgot" && password.length < 8) return setError("Password must have at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: `${window.location.origin}/reset-password` });
        if (resetError) throw resetError;
        setMessage("Check your email for the password reset link.");
      } else if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: window.location.origin } });
        if (signUpError) throw signUpError;
        if (!data.session) setMessage("Account created. Check your email to confirm it, then sign in.");
        else await navigate({ to: "/" });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (signInError) throw signInError;
        await navigate({ to: destination });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-ember md:grid-cols-[.9fr_1.1fr]">
        <div className="hidden bg-command p-10 text-sidebar-foreground md:flex md:flex-col md:justify-between">
          <div><p className="font-display text-xl font-bold text-primary">PROVE IT.</p><p className="mt-2 text-xs text-sidebar-foreground/55">Private student command center</p></div>
          <div><p className="font-display text-3xl font-semibold leading-tight">Build the proof, one focused day at a time.</p><p className="mt-4 text-xs leading-5 text-sidebar-foreground/55">Your profile, goals, resume, and progress stay connected to your account.</p></div>
        </div>
        <div className="p-6 sm:p-9">
          <p className="font-display text-lg font-bold md:hidden">PROVE IT<span className="text-primary">.</span></p>
          <h1 className="mt-6 font-display text-2xl font-semibold">{mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}</h1>
          <p className="mt-2 text-xs text-muted-foreground">{mode === "forgot" ? "We’ll email you a secure reset link." : "Continue to your private progress tracker."}</p>
        <form onSubmit={submit} className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
          <div><Label htmlFor="email">Email</Label><div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value.slice(0,255))} className="pl-9" required /></div></div>
          {mode !== "forgot" && <div><Label htmlFor="password">Password</Label><div className="relative mt-1.5"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value.slice(0,128))} className="px-9" required minLength={8} /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></div>}
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}{message && <p role="status" className="text-xs text-success">{message}</p>}
          <Button type="submit" variant="command" className="w-full" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}{mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</Button>
        </form>
        <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs"><Button type="button" variant="link" className="h-auto p-0" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>{mode === "signup" ? "Already have an account?" : "Create an account"}</Button><Button type="button" variant="link" className="h-auto p-0" onClick={() => setMode(mode === "forgot" ? "signin" : "forgot")}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div>
      </div>
    </section>
  </main>
  );
}
