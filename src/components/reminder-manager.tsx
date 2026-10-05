import { useEffect } from "react";
import {
  REMINDER_STORAGE_KEY,
  REMINDER_UPDATED_EVENT,
  readReminderPreferences,
  type ReminderPreference,
} from "@/lib/reminder-preferences";

const MAX_TIMEOUT = 2_147_483_647;

function millisecondsUntil(time: string) {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return Math.min(next.getTime() - now.getTime(), MAX_TIMEOUT);
}

function scheduleReminder(preference: ReminderPreference, title: string, body: string) {
  if (!preference.enabled || Notification.permission !== "granted") return undefined;

  let timeoutId: number;
  const scheduleNext = () => {
    timeoutId = window.setTimeout(() => {
      new Notification(title, { body, tag: title });
      scheduleNext();
    }, millisecondsUntil(preference.time));
  };
  scheduleNext();
  return () => window.clearTimeout(timeoutId);
}

export function ReminderManager() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    let cleanups: Array<() => void> = [];
    const reschedule = () => {
      cleanups.forEach((cleanup) => cleanup());
      const preferences = readReminderPreferences();
      cleanups = [
        scheduleReminder(
          preferences.checklist,
          "Daily checklist",
          "Time to complete today’s Prove It checklist.",
        ),
        scheduleReminder(
          preferences.applications,
          "Application tracking",
          "Log today’s application and keep your career streak moving.",
        ),
      ].filter((cleanup): cleanup is () => void => Boolean(cleanup));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === REMINDER_STORAGE_KEY) reschedule();
    };

    reschedule();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(REMINDER_UPDATED_EVENT, reschedule);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(REMINDER_UPDATED_EVENT, reschedule);
    };
  }, []);

  return null;
}