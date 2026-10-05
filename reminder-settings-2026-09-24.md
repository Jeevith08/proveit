# Reminder Settings

## Build
- Add a **Reminders** page to the sidebar.
- Add separate controls for **Daily checklist** and **Application tracking** reminders.
- Let each reminder be enabled or disabled independently and assigned its own time.
- Save reminder preferences in this browser so they remain after refresh.
- Show clear saved and permission states without adding sample data.

## Technical details
- Use the existing graphite/blue design system, compact typography, Switch, Input, and Button components.
- Use browser notifications when permission is granted and schedule same-day reminders while the app is open.
- Keep notification permission requests user-triggered and degrade gracefully when notifications are unavailable.
- Add unique page metadata and verify desktop/mobile behavior plus the current build status.
