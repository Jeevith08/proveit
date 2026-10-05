import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser();

    if (!user) throw redirect({ to: "/login", search: { redirect: location.href } });

    return { user };
  },
  component: () => <Outlet />,
});
