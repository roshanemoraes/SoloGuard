# Mapbox Setup Guide for SoloGuard

## Overview

SoloGuard now uses **Mapbox** for map rendering and offline map storage, while continuing to use **Google Places API** for location search and suggestions. This hybrid approach provides:

- **Offline Maps**: Download map regions around destinations for offline access
- **High-Quality Maps**: Street maps, satellite imagery, and terrain data
- **Cost-Effective**: Generous free tier for offline map downloads
- **Privacy-Focused**: No tracking telemetry

## Getting Your Mapbox Access Token

### Step 1: Create a Mapbox Account

1. Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
2. Sign up for a free account (no credit card required for the free tier)
3. Verify your email address

### Step 2: Get Your Access Token

1. Log in to your Mapbox account
2. Go to your [Account Dashboard](https://account.mapbox.com/)
3. Navigate to **Access Tokens** section
4. You'll see a **Default public token** - copy this token
5. Alternatively, create a new token with these scopes:
   - `DOWNLOADS:READ` (for offline map downloads)
   - `MAPS:READ` (for map display)

### Step 3: Add Token to Your Project

1. Open the `.env` file in your project root
2. Replace `YOUR_MAPBOX_TOKEN_HERE` with your actual token:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwi..."
```

**Important**: Keep your token private. Do not commit the `.env` file to version control.

## Mapbox Free Tier Limits

Mapbox offers generous free tier limits:

- **Map Views**: 50,000 free map loads per month
- **Offline Downloads**: Unlimited downloads for mobile apps
- **Offline Storage**: Up to 6,000 tiles per offline region

For SoloGuard's typical usage (5-10 destinations with 5km radius):
- Each destination uses approximately 500-1000 tiles
- Total storage: ~10-20 MB per destination
- Well within the free tier limits

## Configuration

### Mapbox Settings

The Mapbox configuration is located in `src/config/mapbox.ts`:

```typescript
export const OFFLINE_PACK_CONFIG = {
  minZoom: 10,  // City-level zoom
  maxZoom: 16,  // Street-level zoom
  styleURL: MAPBOX_STYLE_URL,
};
```

**Available Map Styles:**
- `mapbox://styles/mapbox/streets-v12` (default) - Street map
- `mapbox://styles/mapbox/satellite-streets-v12` - Satellite imagery
- `mapbox://styles/mapbox/outdoors-v12` - Outdoor/hiking map

### Offline Map Settings

You can adjust offline download settings in the app:

1. Open the **Offline Maps** screen from the Trip tab
2. Configure **Download Radius** (1-20 km)
3. Enable **Auto-download** for new destinations

**Recommended Settings:**
- **Urban areas**: 3-5 km radius
- **Rural areas**: 5-10 km radius
- **Remote areas**: 10-15 km radius

## Using Offline Maps

### Download Maps for Destinations

**Method 1: Download All**
1. Go to Trip tab
2. Add your trip destinations
3. Tap **"Offline Maps"** button
4. Tap **"Download All Destinations"**

**Method 2: Download Individual**
1. In Offline Maps screen
2. Find specific destination
3. Tap **"Download"** button for that destination

### View Downloaded Maps

1. Navigate to **Offline Maps** screen
2. See list of downloaded map packs
3. View storage usage and details
4. Delete individual packs to free space

### Access Maps Offline

Once downloaded, maps work automatically offline:
- **No internet required** for viewing maps
- **All roads and places** are stored locally
- **Search still requires internet** (uses Google Places API)
- **Cached places** shown when offline

## Troubleshooting

### Maps Not Displaying

**Issue**: Blank map or "unable to load map" error

**Solutions**:
1. Check your Mapbox token is correct in `.env`
2. Rebuild the app: `npm run android` or `npm run ios`
3. Verify internet connection for initial map load
4. Check Mapbox dashboard for API usage/errors

### Offline Maps Not Downloading

**Issue**: Download starts but fails or gets stuck

**Solutions**:
1. Check available device storage (need ~20MB free per destination)
2. Ensure stable internet connection during download
3. Try smaller download radius (reduce from 10km to 5km)
4. Restart the app and try again
5. Check Mapbox account isn't over quota

### High Storage Usage

**Issue**: App using too much storage

**Solutions**:
1. Go to **Offline Maps** screen
2. Check **Storage Used** at the top
3. Delete unused destination maps
4. Reduce **Download Radius** before downloading new maps
5. Tap **"Delete All Maps"** to start fresh

### Token Invalid or Expired

**Issue**: "Invalid access token" error

**Solutions**:
1. Verify token is copied correctly (no extra spaces)
2. Check token hasn't been deleted from Mapbox dashboard
3. Create a new token with correct scopes
4. Update `.env` file and rebuild app

## Development Build Required

Mapbox requires a development build (not Expo Go):

```bash
# Build for Android
npx expo run:android

# Build for iOS
npx expo run:ios
```

See main README.md for complete build instructions.

## API Integration Details

### What Uses Mapbox

- ✅ **Map rendering** in Trip screen
- ✅ **Offline map storage** for destinations
- ✅ **User location display** on maps
- ✅ **Map interactions** (tap, zoom, pan)

### What Uses Google Places API

- ✅ **Location search** and autocomplete
- ✅ **Place suggestions** (restaurants, hospitals, etc.)
- ✅ **Nearby places** discovery
- ✅ **Address geocoding** for places

Both APIs work together seamlessly!

## Cost Comparison

| Feature | Mapbox (Free Tier) | Google Maps (Free Tier) |
|---------|-------------------|------------------------|
| Map Views/Month | 50,000 | 28,500 |
| Offline Downloads | Unlimited | Not available |
| Geocoding | 100,000/month | Limited |
| Pricing After Free | $5/1000 views | $7/1000 views |

**Result**: Mapbox is more cost-effective for offline usage and provides better free tier limits.

## Privacy & Security

### Data Collection

- **Mapbox**: Telemetry disabled by default (`setTelemetryEnabled(false)`)
- **No tracking** of user location or app usage
- **Offline maps**: No data sent when using offline

### Token Security

- **Never commit** `.env` file to Git
- **Add to .gitignore**: `.env` should already be ignored
- **Regenerate token** if accidentally exposed
- **Use secret tokens** for server-side operations (not needed for mobile)

## Resources

- [Mapbox Documentation](https://docs.mapbox.com/)
- [Mapbox GL React Native](https://github.com/rnmapbox/maps)
- [Offline Maps Guide](https://docs.mapbox.com/android/maps/guides/offline/)
- [Mapbox Pricing](https://www.mapbox.com/pricing)

## Support

If you encounter issues:

1. Check this guide first
2. Review [Mapbox troubleshooting docs](https://docs.mapbox.com/help/troubleshooting/)
3. Check GitHub issues for `@rnmapbox/maps`
4. Contact Mapbox support for token/account issues

---

**Next Steps**: See main README.md for complete app setup and running instructions.
