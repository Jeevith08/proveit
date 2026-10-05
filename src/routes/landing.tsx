import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing-page";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Prove It — Student Command Center" },
      { name: "description", content: "Personal tracker for daily learning, college check-in, projects, job applications, and streaks." },
      { property: "og:title", content: "Prove It — Student Command Center" },
      { property: "og:description", content: "Stay locked in. Kill them with your success and bury them with your smile." },
    ],
  }),
  component: LandingPage,
});

