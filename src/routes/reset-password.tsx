import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — Prove It" }, { name: "description", content: "Choose a new password for your Prove It account." },
    { property: "og:title", content: "Reset password — Prove It" }, { property: "og:description", content: "Secure password recovery for Prove It." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}), component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate(); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async(event:FormEvent)=>{event.preventDefault();setError("");if(!window.location.hash.includes("type=recovery"))return setError("Open this page from the reset link in your email.");if(password.length<8)return setError("Password must have at least 8 characters.");if(password!==confirm)return setError("Passwords do not match.");setBusy(true);const {error:updateError}=await supabase.auth.updateUser({password});setBusy(false);if(updateError)return setError(updateError.message);await navigate({to:"/"});};
  return <main className="grid min-h-screen place-items-center bg-background p-4"><section className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-ember"><p className="font-display text-lg font-bold">PROVE IT<span className="text-primary">.</span></p><h1 className="mt-6 font-display text-2xl font-semibold">Choose a new password</h1><form onSubmit={submit} className="mt-6 space-y-4"><div><Label htmlFor="password">New password</Label><Input id="password" className="mt-1.5" type="password" value={password} onChange={(e)=>setPassword(e.target.value.slice(0,128))} minLength={8} required /></div><div><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" className="mt-1.5" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value.slice(0,128))} minLength={8} required /></div>{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}<Button variant="command" className="w-full" disabled={busy}>{busy?"Updating…":"Update password"}</Button></form></section></main>;
}
