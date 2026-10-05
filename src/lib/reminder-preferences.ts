export type ReminderPreference = {
  enabled: boolean;
  time: string;
};

export type ReminderPreferences = {
  checklist: ReminderPreference;
  applications: ReminderPreference;
};

export const REMINDER_STORAGE_KEY = "prove-it-reminders";
export const REMINDER_UPDATED_EVENT = "prove-it-reminders-updated";

export const defaultReminderPreferences: ReminderPreferences = {
  checklist: { enabled: false, time: "08:00" },
  applications: { enabled: false, time: "18:00" },
};

export function readReminderPreferences(): ReminderPreferences {
  if (typeof window === "undefined") return defaultReminderPreferences;

  try {
    const stored = window.localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!stored) return defaultReminderPreferences;
    const parsed = JSON.parse(stored) as Partial<ReminderPreferences>;
    return {
      checklist: {
        enabled: Boolean(parsed.checklist?.enabled),
        time: isValidTime(parsed.checklist?.time) ? parsed.checklist.time : "08:00",
      },
      applications: {
        enabled: Boolean(parsed.applications?.enabled),
        time: isValidTime(parsed.applications?.time) ? parsed.applications.time : "18:00",
      },
    };
  } catch {
    return defaultReminderPreferences;
  }
}

export function writeReminderPreferences(preferences: ReminderPreferences) {
  window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(REMINDER_UPDATED_EVENT));
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}