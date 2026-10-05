import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, CheckCircle2, ClipboardCheck, Send } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  defaultReminderPreferences,
  REMINDER_UPDATED_EVENT,
  readReminderPreferences,
  writeReminderPreferences,
  type ReminderPreferences,
} from "@/lib/reminder-preferences";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Reminder Settings — Prove It" },
      { name: "description", content: "Set daily checklist and application tracking reminders." },
      { property: "og:title", content: "Reminder Settings — Prove It" },
      { property: "og:description", content: "Choose when Prove It reminds you to complete daily work and track applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RemindersPage,
});

type PermissionState = NotificationPermission | "unsupported";

function getPermissionState(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function RemindersPage() {
  const [preferences, setPreferences] = useState<ReminderPreferences>(defaultReminderPreferences);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    setPreferences(readReminderPreferences());
    setPermission(getPermissionState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeReminderPreferences(preferences);
    setSaved(true);
    const timeout = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [loaded, preferences]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    window.dispatchEvent(new CustomEvent(REMINDER_UPDATED_EVENT));
  };

  const updatePreference = (
    key: keyof ReminderPreferences,
    update: Partial<ReminderPreferences[keyof ReminderPreferences]>,
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: { ...current[key], ...update },
    }));
  };

  const needsPermission =
    permission !== "granted" && (preferences.checklist.enabled || preferences.applications.enabled);

  return (
    <TrackerShell>
      <PageHeading
        eyebrow="Stay consistent"
        title="Reminder settings"
        description="Choose when Prove It should nudge you. Each reminder works independently."
      />

      <div className="mb-5 flex min-h-10 items-center justify-between gap-3 border-y border-border py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {permission === "granted" ? (
            <BellRing className="size-4 text-success" />
          ) : (
            <Bell className="size-4 text-foreground" />
          )}
          <span>
            {permission === "granted"
              ? "Browser reminders are allowed."
              : permission === "denied"
                ? "Browser reminders are blocked in your browser settings."
                : permission === "unsupported"
                  ? "This browser does not support reminders."
                  : "Allow browser reminders to receive alerts."}
          </span>
        </div>
        {permission === "default" && (
          <Button size="sm" onClick={requestPermission}>
            <BellRing /> Allow reminders
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReminderSetting
          id="checklist"
          icon={<ClipboardCheck className="size-4" />}
          title="Daily checklist"
          description="A daily prompt for Gym, DSA, System Design, VQAR, and Project work."
          enabled={preferences.checklist.enabled}
          time={preferences.checklist.time}
          onEnabledChange={(enabled) => updatePreference("checklist", { enabled })}
          onTimeChange={(time) => updatePreference("checklist", { time })}
        />
        <ReminderSetting
          id="applications"
          icon={<Send className="size-4" />}
          title="Application tracking"
          description="A daily prompt to apply once and update your career pipeline."
          enabled={preferences.applications.enabled}
          time={preferences.applications.time}
          onEnabledChange={(enabled) => updatePreference("applications", { enabled })}
          onTimeChange={(time) => updatePreference("applications", { time })}
        />
      </div>

      <div className="mt-4 flex h-6 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        {saved && (
          <>
            <CheckCircle2 className="size-4 text-success" /> Settings saved
          </>
        )}
        {!saved && needsPermission && permission !== "unsupported" && (
          <span>Enable browser permission for active reminders.</span>
        )}
      </div>
    </TrackerShell>
  );
}

function ReminderSetting({
  id,
  icon,
  title,
  description,
  enabled,
  time,
  onEnabledChange,
  onTimeChange,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  time: string;
  onEnabledChange: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
}) {
  return (
    <section className={`glass-panel rounded-xl p-5 transition-colors ${enabled ? "border-primary" : ""}`}>
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 gap-3">
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {icon}
          </div>
          <div>
            <Label htmlFor={`${id}-enabled`} className="text-sm font-semibold">{title}</Label>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch
          id={`${id}-enabled`}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={`${enabled ? "Disable" : "Enable"} ${title} reminder`}
        />
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <Label htmlFor={`${id}-time`} className="text-[11px] uppercase text-muted-foreground">Reminder time</Label>
        <Input
          id={`${id}-time`}
          type="time"
          value={time}
          disabled={!enabled}
          onChange={(event) => onTimeChange(event.target.value)}
          className="mt-2 max-w-40 [color-scheme:light]"
        />
      </div>
    </section>
  );
}