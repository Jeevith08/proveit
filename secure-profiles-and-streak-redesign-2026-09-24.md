# Secure profiles and streak redesign

## Build
- Add a public sign-up and sign-in screen with email/password and Google.
- Require email confirmation after sign-up and include forgot/reset-password flows.
- Move every tracker page behind sign-in, preserving all current tracker features and the four-second intro.
- Add a first-time profile setup asking for name, college, pass-out year, goal, tagline, passion, dream, date of birth, and an optional PDF resume.
- Add a Profile page for reviewing and updating those private details and replacing the resume.
- Add session-aware profile access and safe sign-out that clears private cached data.
- Redesign the header streak as a compact flame counter and add a profile streak area inspired by the uploaded references: current streak, best streak, and a horizontal contribution calendar without sample activity.

## Data and privacy
- Save one private profile per account; each user can only access their own record.
- Store resumes in a private 5 MB area, scoped to the signed-in user.
- Keep zero dummy records. Streak history starts empty and reflects real dated completion data once tracking persistence is added.
- Validate all profile fields, dates, file type, and file size before saving.

## Verification
- Test sign-up states, sign-in, sign-out, protected-page redirects, profile creation/editing, resume upload validation, and desktop/mobile layouts.
- Run security checks and confirm the app builds without errors.
