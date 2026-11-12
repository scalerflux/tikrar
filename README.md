# Tikrar

Tikrar is a focused Quran memorization companion for building a consistent hifz routine. It combines a daily revision plan with progress tracking, audio/voice support, tafseer, ustad sessions, and gentle reminders.

[Download the latest Android APK](https://github.com/scalerflux/tikrar/releases/download/v1.0.8-local/Tikrar-1.0.8-local.apk) · [View the v1.0.8-local release](https://github.com/scalerflux/tikrar/releases/tag/v1.0.8-local)

## What is included

- A daily memorization and revision view with phase-aware schedule cards.
- A choice of starting point: from Al-Fatihah in Mus-haf order, or from An-Nas back to Al-Fatihah with the short surahs kept whole.
- A Fajr-to-Fajr day, so work done after midnight still counts for the same portion.
- Progress history and a calendar heat map for consistency at a glance.
- Audio playback, tafseer/translation support, and voice recording for self-review.
- Optional ustad setup during onboarding, with custom weekly days, local times, calendar events, and session reminders.
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

The repository builds its own APK with the workflow at [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml). It needs no Expo account and no secrets.

1. Open **Actions → Android APK → Run workflow**.
2. Keep the branch as `main`. Enter a version such as `1.1.0`, or leave it empty to use the version in `app.json`.
3. When the run finishes, open the release it created and tap the `.apk` asset from your Android browser.
4. Android's built-in package installer will open and ask you to confirm installation. If prompted, allow your browser to install unknown apps. No Expo Go, store app, or separate installer is required.

The APK is a normal Android package. Android does not allow a website to silently install an APK, so the final confirmation screen is always controlled by the system package installer.

Running the workflow again for the same version replaces the APK on that release. Every push to `main` also runs the typecheck and tests through [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Build an APK from a terminal

With the Android SDK and Java 17 installed:

```bash
npx expo prebuild --platform android --clean
```

```bash
cd android && ./gradlew assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/`. An EAS project is also configured in `app.json` and `eas.json` if you prefer `npm run build:apk`, which needs an Expo account.

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

Tikrar's source code is released under the [MIT License](LICENSE). Third-party dependencies, bundled media, Quran content, translations, recitations, and other externally sourced material remain subject to their respective licenses and attribution requirements.
