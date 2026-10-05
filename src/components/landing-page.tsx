import { useNavigate, Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "signin" | "signup" | "forgot";

export function LandingPage() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openAuth = (mode: AuthMode = "signin") => {
    setAuthMode(mode);
    setError("");
    setMessage("");
    setIsAuthOpen(true);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAuthOpen(false);
    };
    if (isAuthOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isAuthOpen]);

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (authMode !== "forgot" && password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (authMode === "forgot") {
        const { error: e } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (e) throw e;
        setMessage("Check your email for the reset link.");
      } else if (authMode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (e) throw e;
        if (!data.session) setMessage("Account created! Check your email to confirm, then sign in.");
        else {
          setIsAuthOpen(false);
          await navigate({ to: "/" });
        }
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (e) throw e;
        setIsAuthOpen(false);
        await navigate({ to: "/" });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="relative min-h-screen bg-background font-body text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* ── TOP HEADER / NAVBAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-decoration-none">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold shadow-sm">
                P
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-none tracking-tight text-foreground">
                  PROVE IT<span className="text-primary">.</span>
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Command Center
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#methodology" className="text-muted-foreground transition-colors hover:text-foreground">
              Daily Grind
            </a>
            <a href="#streaks" className="text-muted-foreground transition-colors hover:text-foreground">
              Streak System
            </a>
          </nav>

          {/* Actions: Open Login Drawer */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs font-semibold"
              onClick={() => openAuth("signin")}
            >
              Sign In
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-sm"
              onClick={() => openAuth("signup")}
            >
              Get Started <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Headline and Pitch */}
            <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm transition-transform hover:scale-105">
                <Flame className="size-4 text-warning animate-bounce" />
                <span>Student Command Center &middot; Stay Locked In</span>
              </div>

              {/* Main Headline with compact, elegant size and balanced emphasis */}
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl text-foreground leading-snug">
                <span className="block animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  Kill them with your{" "}
                  <span className="font-extrabold text-foreground underline decoration-primary/40 decoration-2 underline-offset-4">
                    success
                  </span>,
                </span>
                <span className="block mt-1 sm:mt-1.5 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                  bury them with your{" "}
                  <span className="relative inline-block font-extrabold text-foreground">
                    smile.
                    <svg
                      className="absolute -bottom-1.5 left-0 w-full overflow-visible text-primary/70"
                      viewBox="0 0 100 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 5C15 1 20 7 35 5C50 3 55 7 70 5C85 3 90 7 100 5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="quote-rise max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm"
                style={{ animationDelay: "0.9s" }}
              >
                Win the hours outside class. Prove It is your personal daily execution operating system &mdash; track your college attendance, DSA prep, System Design, project builds, and job applications with uncompromising consistency.
              </p>

              {/* CTA Buttons */}
              <div
                className="quote-rise flex flex-col items-center justify-center gap-2.5 sm:flex-row lg:justify-start"
                style={{ animationDelay: "1.1s" }}
              >
                <Button
                  type="button"
                  size="default"
                  onClick={() => openAuth("signin")}
                  className="h-10 w-full sm:w-auto px-6 font-display font-bold shadow-md shadow-primary/20 text-xs transition-all duration-300 hover:scale-105"
                >
                  Enter Command Center <ChevronRight className="ml-1.5 size-3.5" />
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="h-10 w-full sm:w-auto px-5 text-xs font-semibold border-border/80 transition-all duration-300 hover:bg-secondary"
                >
                  <a href="#features">Explore Modules</a>
                </Button>
              </div>

              {/* Trust badges */}
              <div
                className="quote-rise flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-muted-foreground lg:justify-start"
                style={{ animationDelay: "1.3s" }}
              >
                <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <ShieldCheck className="size-4 text-success" /> 100% Private (Row Level Security)
                </span>
                <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <Zap className="size-4 text-primary" /> Live Realtime Sync
                </span>
                <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <Sparkles className="size-4 text-warning" /> Zero Dummy Data
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-2 shadow-2xl backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-xl bg-secondary/80 flex items-center justify-center p-2 sm:p-4">
                  <img
                    src="/hero-study.jpg"
                    alt="Student Developer Command Center"
                    className="h-[320px] w-full object-contain drop-shadow-md transition-transform duration-700 hover:scale-105 sm:h-[400px]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                </div>

                {/* Floating Badge 1: Streak */}
                <div className="animate-float absolute -top-3 right-1 sm:-right-2 rounded-xl border border-border bg-card/95 p-2.5 sm:p-3 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Flame className="size-4 streak-flame text-primary" />
                    </span>
                    <div>
                      <p className="font-display text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Streak Momentum
                      </p>
                      <p className="font-display text-xs font-bold text-foreground">
                        14 Days Active 🔥
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 2: Missions Complete */}
                <div className="animate-float-delayed absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 rounded-xl border border-border/90 bg-card/95 p-3 sm:p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" />
                      <span className="font-display text-xs font-bold text-foreground">Today's Missions</span>
                    </div>
                    <span className="font-display text-xs font-bold text-primary">5 / 5 Done (100%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-full rounded-full bg-primary transition-all duration-1000" />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between font-display text-[11px] text-muted-foreground">
                    <span>Gym &middot; DSA &middot; System Design &middot; Projects</span>
                    <span className="font-display font-semibold text-foreground flex items-center gap-1.5">
                      Locked In <span className="size-1.5 rounded-full bg-primary animate-ping inline-block" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────────────── */}
      <section id="features" className="border-t border-border/60 bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-[11px] font-bold uppercase tracking-wider text-primary">
              Engineered For Results
            </h2>
            <p className="mt-2 font-display text-xl font-bold tracking-tight text-foreground sm:text-3xl">
              Everything you need to prove your consistency.
            </p>
            <p className="mt-2.5 text-xs text-muted-foreground sm:text-sm">
              Designed specifically for final-year students, engineers, and ambitious self-starters who refuse to make excuses.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <LayoutDashboard className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-foreground">Daily Command Center</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Checklist missions with strict Yes/No accountability. If you miss a task, document the exact reason so you never deceive yourself.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success transition-colors group-hover:bg-success group-hover:text-primary-foreground">
                <CalendarCheck className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-foreground">College Check-In</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Log Monday-to-Friday attendance. Track whether you attended lectures or stayed home, and capitalize on every hour outside the classroom.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning transition-colors group-hover:bg-warning group-hover:text-primary-foreground">
                <BookOpen className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-foreground">Deep Learning Tracker</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Log hours across DSA, System Design, VQAR, and Domain topics. View week-over-week trends and build real technical depth.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <FolderKanban className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-foreground">Project Pipeline</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Manage fullstack builds from Planning to Building, Completed, and Live. Attach repo and deployment links to showcase proof of work.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors group-hover:bg-destructive group-hover:text-primary-foreground">
                <Briefcase className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-foreground">Job &amp; Internship Tracker</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Target 1 application per day. Track stages from Applied to Shortlisted, Interview, and Offer with zero friction.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning transition-colors group-hover:bg-warning group-hover:text-primary-foreground">
                <Award className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-foreground">Streaks, Badges &amp; History</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Unlock 3, 7, 14, 30, 60, and 100-day consistency badges. Look back at past days using the retrospective calendar history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── METHODOLOGY & PHILOSOPHY SECTION ───────────────────────── */}
      <section id="methodology" className="border-t border-border/60 bg-command py-14 text-white sm:py-20">
        <div id="streaks" className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
            The Philosophy
          </p>
          <blockquote className="mt-4 font-display text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl text-white drop-shadow-md">
            &ldquo;Everything happens for a reason.&rdquo;
          </blockquote>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Stay locked in &middot; Win the hours outside class &middot; Prove It
          </p>
          <div className="mt-7">
            <Button
              type="button"
              onClick={() => openAuth("signin")}
              size="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-6 h-10 shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              Launch Your Workspace <ChevronRight className="ml-1.5 size-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-card py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="font-display text-sm font-bold text-foreground">
              PROVE IT<span className="text-primary">.</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Personal student progress operating system.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <button
              type="button"
              onClick={() => openAuth("signin")}
              className="transition-colors hover:text-foreground"
            >
              Sign In
            </button>
            <span>&middot;</span>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="transition-colors hover:text-foreground"
            >
              Create Account
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Prove It. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── SLIDE-OVER LOGIN DRAWER (Opens smoothly from right to left half) ── */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay with smooth fade */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsAuthOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container: slides smoothly from right to left, occupying right half on desktop */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside
              className="w-screen max-w-md sm:max-w-lg lg:w-[480px] xl:w-[520px] bg-background shadow-2xl border-l border-border p-6 sm:p-10 flex flex-col justify-between overflow-y-auto animate-slide-in-right"
              role="dialog"
              aria-modal="true"
              aria-labelledby="slide-auth-title"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-6 border-b border-border/70">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground shadow">
                      P
                    </span>
                    <div>
                      <p className="font-display text-base font-bold text-foreground leading-none">
                        PROVE IT<span className="text-primary">.</span>
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                        Command Center
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => setIsAuthOpen(false)}
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Form Title & Subtitle */}
                <div className="mt-8">
                  <h2 id="slide-auth-title" className="font-display text-2xl font-bold text-foreground">
                    {authMode === "signin"
                      ? "Welcome back"
                      : authMode === "signup"
                      ? "Create your account"
                      : "Reset your password"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {authMode === "forgot"
                      ? "We'll email you a secure link to reset your password."
                      : "Unlock your private student tracker & streak command center."}
                  </p>
                </div>

                {/* Email & Password Form */}
                <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="drawer-email" className="text-xs font-semibold">
                      Email address
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="drawer-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                        className="pl-9 text-xs h-10"
                        required
                      />
                    </div>
                  </div>

                  {authMode !== "forgot" && (
                    <div>
                      <Label htmlFor="drawer-password" className="text-xs font-semibold">
                        Password
                      </Label>
                      <div className="relative mt-1.5">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="drawer-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                          placeholder="Min. 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value.slice(0, 128))}
                          className="px-9 text-xs h-10"
                          required
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {error}
                    </p>
                  )}
                  {message && (
                    <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
                      {message}
                    </p>
                  )}

                  <Button type="submit" className="w-full font-bold h-10 text-xs" variant="command" disabled={busy}>
                    {busy && <LoaderCircle className="mr-2 size-3.5 animate-spin" />}
                    {authMode === "signin"
                      ? "Sign In to Workspace"
                      : authMode === "signup"
                      ? "Create Account"
                      : "Send Reset Link"}
                    {!busy && <ChevronRight className="ml-1 size-3.5" />}
                  </Button>
                </form>

                {/* Switchers */}
                <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs">
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setAuthMode(authMode === "signup" ? "signin" : "signup");
                      setError("");
                      setMessage("");
                    }}
                  >
                    {authMode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                  <button
                    type="button"
                    className="font-medium text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setAuthMode(authMode === "forgot" ? "signin" : "forgot");
                      setError("");
                      setMessage("");
                    }}
                  >
                    {authMode === "forgot" ? "Back to sign in" : "Forgot password?"}
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-border/60 text-center">
                <p className="text-[11px] text-muted-foreground">
                  &copy; {new Date().getFullYear()} Prove It &middot; Your data is 100% private.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
