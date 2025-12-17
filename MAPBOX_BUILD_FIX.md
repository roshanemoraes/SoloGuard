# Mapbox Build Fix - 403 Forbidden Error

## Current Problem

The build is failing with:
```
Could not GET 'https://api.mapbox.com/downloads/v2/releases/maven/...'.
Received status code 403 from server: Forbidden
```

## Root Cause

Your current token (`pk.eyJ1...`) is a **public token** which works for client-side map rendering but **NOT** for downloading Mapbox SDK dependencies during the build process.

For Gradle/Maven downloads, Mapbox requires a **secret token** with `DOWNLOADS:READ` scope.

## Solution: Get a Mapbox Secret Token

### Step 1: Create a Secret Token

1. Go to https://account.mapbox.com/access-tokens/
2. Click **"Create a token"**
3. Give it a name (e.g., "Android Downloads")
4. Under **Secret scopes**, check ✅ **`DOWNLOADS:READ`**
5. Click **"Create token"**
6. **IMPORTANT**: Copy the token immediately (starts with `sk.`)

### Step 2: Update gradle.properties

Replace the token in `android/gradle.properties`:

```properties
# Mapbox Downloads Token (SECRET token with DOWNLOADS:READ scope)
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ1IjoibXNj...YOUR_SECRET_TOKEN_HERE
```

**CRITICAL**: This is a SECRET token - never commit it to Git!

### Step 3: Add to .gitignore

Make sure `android/gradle.properties` is in your `.gitignore`:

```
# Android
android/gradle.properties
android/local.properties
```

### Step 4: Rebuild

```bash
npx expo run:android
```

## Alternative: Use Public Maven Repository (Not Recommended)

If you can't get a secret token, you can try using the older public repositories, but this may not have the latest versions.

## Environment Variables Summary

You'll have TWO different Mapbox tokens:

| Token Type | Scope | Used For | Location |
|------------|-------|----------|----------|
| **Public Token** (`pk.`) | Maps display | Runtime map rendering | `.env` file |
| **Secret Token** (`sk.`) | DOWNLOADS:READ | SDK download during build | `android/gradle.properties` |

## Files Changed So Far

✅ `app.config.js` - Removed Mapbox plugin (causes build issues)
✅ `android/build.gradle` - Added Mapbox Maven repository
✅ `android/gradle.properties` - Added MAPBOX_DOWNLOADS_TOKEN (needs secret token)
✅ `src/config/mapbox.ts` - Runtime initialization
✅ `src/components/MapboxMap.tsx` - Mapbox map component
✅ `src/services/offlineMapService.ts` - Offline map management

## What's Working

✅ Mapbox package installed
✅ Expo autolinking recognizes Mapbox module
✅ Android build configuration correct
✅ Gradle can find Mapbox Maven repository
❌ Authentication fails (needs secret token)

## Next Steps

1. **Get secret token from Mapbox dashboard**
2. **Update `android/gradle.properties`** with secret token
3. **Run `npx expo run:android`**
4. App should build successfully!

## Security Note

**NEVER** commit your secret token to Git:
- Add `android/gradle.properties` to `.gitignore`
- Use environment variables for CI/CD
- For team members, share token securely (not in code)

## For EAS Build

If using EAS for cloud builds:

1. Go to https://expo.dev → your project → Secrets
2. Add secret: `MAPBOX_DOWNLOADS_TOKEN` = your secret token
3. Update `eas.json` to use the secret

---

Once you add the secret token, the build should complete successfully! 🚀
