# SoloGuard

Mobile app that runs through Expo Go (SDK 50). Use your phone to load the project via QR code.

## Prerequisites
- Node.js and npm
- Expo Go app on your phone (SDK 50)
- Phone and development machine on the same Wi-Fi network

## Setup
1) Clone the repository
```bash
git clone https://github.com/roshanemoraes/SoloGuard.git
cd SoloGuard
```
2) Install dependencies
```bash
npm install
```
3) Start the Expo server (clears cache)
```bash
npx expo start -c
```

## Run on your phone
- Open Expo Go and scan the QR code from the terminal or Metro web page.
- Keep both devices on the same network for discovery to work.

## Quick tips
- If scanning fails or the bundle stalls, press `r` in the Metro CLI to restart.
- In the CLI, press `a` for Android emulator or `i` for iOS simulator (macOS) if available.