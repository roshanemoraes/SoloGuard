# SoloGuard
Mobile-first safety companion for solo travelers in Sri Lanka (Expo / React Native). SoloGuard monitors activity, battery, and location, provides rapid SOS, and keeps loved ones informed even with poor connectivity.

## Why it exists
Solo travel in Sri Lanka is popular but risky: accidents in remote areas, unnoticed emergencies, spotty connectivity, and anxious families with no easy way to check in. SoloGuard reduces these risks with automated monitoring, quick SOS, low-battery safeguards, and offline-ready trip planning.

## Core features
- **Status & monitoring**: Tracks location and battery; shows monitoring state (active/inactive/emergency).
- **Manual SOS**: One-tap SOS sends last-known details to trusted contacts.
- **Abnormal inactivity detection**: Prompts on prolonged inactivity; can auto-trigger alerts.
- **Low-battery alerts**: Sends last-known location when power is critical.
- **Trip planning**: Search/add destinations (Google Places) with autocomplete; view and manage trip list; nearby exploration and map picker.
- **Offline resilience**: Caches planned destinations and key safety info for poor connectivity scenarios.
- **Safety tips & emergency info**: Quick access to guidance and important contacts.
- **Localization**: English and Sinhala (Tamil planned); language selector in Setup.

## Architecture (mobile-first, offline-friendly)
- **Client-only Expo app** (React Native + Expo Router).
- **Local storage** for monitoring data and trip info; SMS as a reliable alert path where data is weak.
- **Location & sensors**: GPS plus device signals to support inactivity detection.
- **Optional backend** ready for future expansion (historical data, observers).

## Project structure (high level)
- `app/` – screens (trip planning, setup, status, logs).
- `components/` – shared UI pieces.
- `src/stores/` – state (e.g., `useI18n`).
- `src/hooks/` – domain hooks (e.g., emergency contacts).
- `assets/` – static assets.

## Prerequisites
- Node.js and npm
- Expo Go app on your phone (SDK 50)
- Phone and development machine on the same Wi-Fi network
- Google Places API key (for search/autocomplete and map picker)

## Setup
1) Clone and install
```bash
git clone https://github.com/roshanemoraes/SoloGuard.git
cd SoloGuard
npm install
```
2) Configure environment
- Create `.env` with:
```
EXPO_PUBLIC_GOOGLE_PLACES_KEY=your_google_places_api_key
```
3) Start Expo (clean cache)
```bash
npx expo start -c
```

## Run on your phone
- Open Expo Go and scan the QR code from the terminal or Metro web page.
- Keep phone and dev machine on the same Wi‑Fi for discovery.

## Key flows to try
- **Status**: See monitoring state, battery, and last location; toggle monitoring.
- **SOS**: Trigger manual SOS and review the confirmation modal.
- **Trip planning**: Search destinations (autocomplete), add to trip list, explore nearby, pick on map (with your API key), swipe to delete.
- **Setup**: Add emergency contacts, adjust thresholds, switch language.
- **Logs**: View and export monitoring logs; filter by date/time.

## Troubleshooting
- Metro stuck or QR fails: press `r` in the Metro CLI to reload; ensure same Wi‑Fi.
- Android emulator / iOS simulator (macOS): press `a` or `i` in the CLI.
- Google maps blank: confirm `EXPO_PUBLIC_GOOGLE_PLACES_KEY` is set and rebuild the dev client if needed.

## Roadmap (from proposal)
- Add Tamil localization.
- Expand offline data (local emergency numbers, more safe spots).
- Optional backend for historical data and observer dashboards.

## License
MIT (see repository license).
