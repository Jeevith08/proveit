import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthView } from "@/components/auth-view";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Sign In — Prove It" },
      { name: "description", content: "Sign in to your Prove It account." },
    ],
  }),
  component: AuthView,
});

