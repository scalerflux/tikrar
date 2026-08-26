# Tikrar

Tikrar is a focused Quran memorization companion for building a consistent hifz routine. It combines a daily revision plan with progress tracking, audio/voice support, tafseer, ustad sessions, and gentle reminders.

## What is included

- A daily memorization and revision view with phase-aware schedule cards.
- Progress history and a calendar heat map for consistency at a glance.
- Audio playback, tafseer/translation support, and voice recording for self-review.
- Optional ustad setup during onboarding, with Markaz Al Fawaid presets or custom days and local times.
- Daily motivational reminders and separate ustad-session reminders.
- Backup and restore support for settings and local progress data.
- Offline-first local storage using SQLite and AsyncStorage.
- Arabic-friendly dark UI designed for focused reading and low-distraction use.

## Run locally

Requirements: Node.js 20+, npm, and Expo Go or an Android emulator/device.

```bash
npm install
npm start
```

Useful commands:

```bash
npm run typecheck
npm test -- --runInBand
npx expo-doctor
npx expo export --platform web
```

To run a native Android development build:

```bash
npm run android
```

## Install the Android APK directly

The repository includes a reproducible EAS build workflow at [`.github/workflows/android-apk-release.yml`](.github/workflows/android-apk-release.yml). It creates an installable APK and attaches it to a GitHub Release.

1. Create an Expo access token in your Expo account.
2. Add it to GitHub as an Actions secret named `EXPO_TOKEN`.
3. Open **Actions → Android APK Release → Run workflow**.
4. Open the created release and tap the `.apk` asset from your Android browser.
5. Android’s built-in package installer will open and ask you to confirm installation. If prompted, allow your browser to install unknown apps; no Expo Go, store app, or separate installer is required.

The APK is a normal Android package. Android does not allow a website to silently install an APK, so the final confirmation screen is always controlled by the system package installer.

The default release version comes from `app.json` plus the GitHub run number. You can provide a version such as `1.0.1` when manually dispatching the workflow.

## Build an APK from a terminal

The EAS project is configured in `app.json` and `eas.json`:

```bash
npx eas-cli@latest build --platform android --profile production-apk
```

The `production-apk` profile intentionally produces an APK for direct phone installation. The `production` profile produces an Android App Bundle for Play Store submission.

## Data and privacy

Tikrar keeps schedule, reminder, session, and progress data on the device by default. Audio recordings and backups are handled through the device's local file/sharing APIs. No account is required to use the core memorization workflow.

## Project structure

```text
app/                 Expo Router screens and onboarding
components/          Today, schedule, progress, and reusable UI
database/             SQLite schema and local persistence
services/              Audio, backup, reminders, translation, and sessions
utils/                Schedule, timezone, reminder, and validation helpers
__tests__/             Unit tests for core behavior
```

## License

See the repository for the current license and contribution terms.
