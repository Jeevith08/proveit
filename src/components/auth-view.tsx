import { useNavigate, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createLocalUser } from "@/lib/auth-session";

type Mode = "signin" | "signup" | "forgot";

export function AuthView() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const continueInOfflineMode = async (emailToUse?: string) => {
    const targetEmail = (emailToUse || email).trim().toLowerCase() || "student@proveit.dev";
    createLocalUser(targetEmail);
    await navigate({ to: "/" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (mode !== "forgot" && password.length < 8)
      return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error: e } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (e) throw e;
        setMessage("Check your email for the reset link.");
      } else if (mode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (e) throw e;
        if (!data.session)
          setMessage("Account created! Check your email to confirm, then sign in.");
        else await navigate({ to: "/" });
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (e) throw e;
        await navigate({ to: "/" });
      }
    } catch (cause) {
      const msg =
        cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
      if (
        msg.includes("fetch") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError")
      ) {
        setError(
          "Cannot reach Supabase. Please verify that your VITE_SUPABASE_URL in .env is correct and active.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setMessage("");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-body">
      {/* ── LEFT HALF — Branding & illustration ─────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-command p-10 lg:flex lg:w-1/2">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_20%,oklch(0.9_0.19_125/0.12),transparent_65%)]" />

        {/* Logo */}
        <Link
          to="/"
          className="relative z-10 flex items-center gap-3 transition-opacity hover:opacity-85"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground shadow-lg">
            P
          </span>
          <div>
            <p className="font-display text-xl font-bold leading-none text-white">
              PROVE IT<span className="text-primary">.</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Command Center
            </p>
          </div>
        </Link>

        {/* Hero illustration */}
        <div className="relative z-10 flex flex-1 items-center justify-center py-8">
          <img
            src="/hero-study.jpg"
            alt="Student at desk studying"
            className="h-auto max-h-[55vh] w-full max-w-md object-contain drop-shadow-2xl"
          />
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 space-y-4">
          <h1 className="font-display text-3xl font-bold leading-snug text-white xl:text-4xl">
            Everything happens
            <br />
            <span className="text-primary">for a reason.</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/55">
            Prove It is your personal student command center — track attendance, DSA, System Design,
            projects, and job applications every single day.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs font-medium text-white/40">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" /> 100% Private
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-primary" /> Realtime Sync
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> Zero Dummy Data
            </span>
          </div>

          {/* Streak pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm">
            <Flame className="size-4 text-primary animate-bounce" />
            Stay Locked In &middot; Student Command Center
          </div>
        </div>
      </div>

      {/* ── RIGHT HALF — Auth form ───────────────────────────────────── */}
      <div className="flex w-full flex-col justify-center overflow-y-auto bg-background px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24 animate-slide-in-right">
        {/* Mobile & Desktop back link */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              P
            </span>
            <p className="font-display text-base font-bold text-foreground">
              PROVE IT<span className="text-primary">.</span>
            </p>
          </Link>
          <Link
            to="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4 ml-auto"
          >
            &larr; Back to overview
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {/* Heading */}
          <h2 className="font-display text-2xl font-bold text-foreground">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "We'll email you a secure reset link."
              : "Continue to your private progress tracker."}
          </p>

          {/* Form */}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="lp-email" className="text-xs font-semibold">
                Email address
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <Label htmlFor="lp-password" className="text-xs font-semibold">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="lp-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, 128))}
                    className="px-9"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="space-y-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
                <p role="alert">{error}</p>
                {(error.includes("Supabase") ||
                  error.includes("fetch") ||
                  error.includes("network")) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive/30 bg-background/80 text-foreground hover:bg-background"
                    onClick={() => continueInOfflineMode()}
                  >
                    <Zap className="mr-1.5 size-3.5 text-primary" />
                    Enter Command Center in Offline Mode
                  </Button>
                )}
              </div>
            )}
            {message && (
              <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
                {message}
              </p>
            )}

            <Button type="submit" className="w-full font-bold" variant="command" disabled={busy}>
              {busy && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create Account"
                  : "Send reset link"}
              {!busy && <ChevronRight className="ml-1 size-4" />}
            </Button>

            {/* Offline Mode Option */}
            <div className="relative my-2 text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-[11px] text-muted-foreground">
                Or test without Supabase
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full text-xs font-semibold"
              onClick={() => continueInOfflineMode()}
            >
              <Zap className="mr-1.5 size-3.5 text-primary" />
              Continue in Offline / Local Mode
            </Button>
          </form>

          {/* Mode switchers */}
          <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs">
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
            <button
              type="button"
              className="font-medium text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => switchMode(mode === "forgot" ? "signin" : "forgot")}
            >
              {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
            </button>
          </div>

          {/* Footer note */}
          <p className="mt-10 text-center text-[11px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Prove It. Your data stays private.
          </p>
        </div>
      </div>
    </div>
  );
}
