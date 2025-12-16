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

## Building Development APK

The map picker feature requires native Google Maps SDK, which doesn't work in Expo Go. You have two options to build a development APK:

### Option 1: Using EAS Build (Cloud)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Set API Key as EAS Environment Variable**
   - Go to your project settings on expo.dev
   - Add environment variable: `EXPO_PUBLIC_GOOGLE_PLACES_KEY`
   - Set visibility to "Sensitive" (not "Secret" - EXPO_PUBLIC_ vars can't be secret)
   - Set value to your Google Places API key

4. **Build for Android**
   ```bash
   eas build --profile development --platform android
   ```
   - This builds on Expo's cloud servers
   - Takes 5-15 minutes depending on queue
   - Download the APK when complete

5. **Install and Run**
   - Install the APK on your Android device
   - Start the dev server:
     ```bash
     npx expo start --dev-client
     ```
   - Open the app on your device

### Option 2: Using Android Studio (Local)

1. **Generate Native Android Project**
   ```bash
   npx expo prebuild --platform android
   ```
   - This creates the `android/` folder with native code
   - The `.env` file is automatically used for configuration

2. **Open in Android Studio**
   - Open Android Studio
   - Click "Open an Existing Project"
   - Navigate to `d:\Projects\SoloGuard\android`
   - Wait for Gradle sync to complete (2-5 minutes)

3. **Build the APK**
   - Go to: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Wait for build to complete (2-10 minutes)
   - APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

   Or use command line from the android folder:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **Install and Run**
   - Install `app-debug.apk` on your Android device
   - From the project root directory, start dev server:
     ```bash
     cd d:\Projects\SoloGuard
     npx expo start --dev-client
     ```
   - Open the app on your device

**Note**: The `android/` and `ios/` folders are gitignored as they're generated files. If you add new native modules or change `app.config.js`, run `npx expo prebuild --clean` to regenerate them.

## Development Workflow

### Making Code Changes (No Rebuild Needed)

For **JavaScript/TypeScript changes** in your app code (`app/`, `components/`, `src/`, etc.):
1. Keep the dev server running:
   ```bash
   npx expo start --dev-client
   ```
2. Make your changes in the code
3. Changes automatically hot-reload on your device
4. **No Android Studio rebuild required!**

### When You Need to Rebuild

Only rebuild the APK when you:
- Add or remove npm packages with native code
- Modify `app.config.js` or native configuration
- Manually edit Android native code in `android/` folder

### Quick Rebuild Options

**Option 1: Android Studio (Uses Cache)**
- Press **Build → Build APK(s)** again
- Gradle uses cached files (1-3 minutes instead of 10+)

**Option 2: Command Line with Cache**
```bash
cd android
./gradlew assembleDebug --build-cache
```

**Option 3: Offline Build (Faster)**
```bash
cd android
./gradlew assembleDebug --offline
```

**If You Added Native Modules:**
```bash
# From project root
npx expo prebuild --clean
# Then rebuild with Android Studio or gradlew
```

## Troubleshooting
- Metro stuck or QR fails: press `r` in the Metro CLI to reload; ensure same Wi‑Fi.
- Android emulator / iOS simulator (macOS): press `a` or `i` in the CLI.
- **Map picker not working**: Build a development client using one of the methods above
- Search and autocomplete work in Expo Go (they use the Places API, not native maps)

## Roadmap (from proposal)
- Add Tamil localization.
- Expand offline data (local emergency numbers, more safe spots).
- Optional backend for historical data and observer dashboards.

## License
MIT (see repository license).
