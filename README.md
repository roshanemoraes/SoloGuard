# SafeGuard

A mobile safety application for solo travelers in Sri Lanka. SafeGuard monitors your safety, detects inactivity or emergencies, and sends automated or manual SOS alerts to trusted contacts. It works offline and uses SMS for reliability in areas with poor data coverage.

## Features

### 🚨 Emergency SOS

- **Manual SOS**: Large, always-visible SOS button for instant emergency alerts
- **Automatic SOS**: Detects inactivity and sends alerts automatically
- **Battery Low Alert**: Sends location when battery is critically low

### 📍 Location & Battery Monitoring

- **Continuous GPS Tracking**: Real-time location monitoring with offline capability
- **Battery Monitoring**: Tracks battery level and sends alerts when low
- **Background Operation**: Continues monitoring even when app is minimized

### 🔧 Smart Detection

- **Motion Sensors**: Uses accelerometer and gyroscope to detect inactivity
- **Configurable Thresholds**: Customizable inactivity and battery thresholds
- **Activity Logging**: Comprehensive logs of all monitoring activities

### 📱 Offline-First Design

- **Preloaded Destinations**: Add hospitals, police stations, and safe areas
- **Offline Maps**: Access important locations without internet
- **SMS Fallback**: Uses SMS when data connection is unavailable

### ⚙️ User Configuration

- **Emergency Contacts**: Add multiple trusted contacts with primary designation
- **Custom Settings**: Adjust monitoring intervals and alert thresholds
- **Trip Planning**: Preload destinations before traveling

## Tech Stack

- **React Native** (latest)
- **Expo** (latest SDK)
- **Expo Router** (App Router v3)
- **TypeScript**
- **Zustand** for state management
- **NativeWind** for styling
- **AsyncStorage** for local storage
- **Expo Location** for GPS tracking
- **Expo Sensors** for motion detection
- **Expo SMS** for emergency alerts

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SafeGuard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Run on device/simulator**

   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web (for testing)
   npm run web
   ```

## Project Structure

```
SafeGuard/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home dashboard
│   │   └── logs.tsx       # Activity logs
│   ├── setup.tsx          # Emergency contacts & settings
│   ├── trip.tsx           # Trip planning
│   └── about.tsx          # App information
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Business logic services
│   ├── stores/            # Zustand state management
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
└── constants/             # App constants
```

## Key Services

### LocationService

- Handles GPS permissions and location tracking
- Provides address resolution and distance calculations
- Manages background location updates

### BatteryService

- Monitors battery level and charging status
- Provides battery status formatting and color coding
- Handles low battery detection

### MotionService

- Uses accelerometer and gyroscope for activity detection
- Configurable inactivity thresholds
- Provides motion data analysis

### SMSService

- Sends emergency alerts via SMS
- Handles test messages and contact validation
- Formats emergency messages with location data

### MonitoringService

- Coordinates all monitoring services
- Manages monitoring lifecycle
- Handles emergency alert triggers

## Usage Guide

### 1. Initial Setup

1. Open the app and navigate to **Setup**
2. Add emergency contacts with phone numbers
3. Configure monitoring settings (thresholds, intervals)
4. Set one contact as primary for priority alerts

### 2. Trip Planning

1. Go to **Trip Planning**
2. Add important destinations (hotels, hospitals, police stations)
3. Use preloaded Sri Lankan emergency locations
4. Save destinations for offline access

### 3. Monitoring

1. Return to **Home** dashboard
2. Press **Start** to begin monitoring
3. Monitor your status: location, battery, contacts
4. Use **SOS** button for emergencies

### 4. Activity Logs

1. Check **Activity Logs** tab for monitoring history
2. View location updates, battery checks, and alerts
3. Clear logs if needed

## Safety Features

### Emergency Contacts

- Add multiple trusted contacts
- Designate primary contact for priority
- Test SMS functionality
- Enable/disable contacts as needed

### Monitoring Settings

- **Inactivity Threshold**: Minutes before automatic alert (default: 30)
- **Battery Threshold**: Battery percentage for low battery alert (default: 10%)
- **Update Interval**: Seconds between location updates (default: 60)
- **Auto SOS**: Enable automatic inactivity alerts
- **Notifications**: Enable push notifications

### Trip Preparation

- Preload important destinations
- Add custom locations with coordinates
- Access emergency service numbers
- View safety tips and guidelines

## Permissions

The app requires the following permissions:

- **Location**: Always and when in use for continuous tracking
- **SMS**: To send emergency alerts to contacts
- **Motion**: To detect inactivity using device sensors

## Emergency Information

### Sri Lankan Emergency Numbers

- **Police**: 119
- **Ambulance**: 110
- **Fire Service**: 110
- **Tourist Police**: +94 11 242 1052

### Preloaded Locations

- Colombo General Hospital
- Colombo Police Station
- Fort Railway Station

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add business logic in `src/services/`
3. Update types in `src/types/`
4. Add custom hooks in `src/hooks/`

### State Management

- Uses Zustand for global state
- Persists emergency contacts and settings
- Stores monitoring logs locally

### Styling

- Uses NativeWind (Tailwind CSS for React Native)
- Custom color scheme for emergency theme
- Dark mode support

## Testing

### Manual Testing

1. Test location permissions and tracking
2. Verify SMS sending functionality
3. Test motion sensor detection
4. Check battery monitoring accuracy
5. Validate emergency contact management

### Device Testing

- Test on both iOS and Android devices
- Verify background operation
- Check offline functionality
- Test in areas with poor connectivity

## Deployment

### Build for Production

```bash
# Create production build
expo build:android
expo build:ios
```

### App Store Submission

1. Update version in `app.json`
2. Create production build
3. Submit to Google Play Store / Apple App Store
4. Include required permissions and descriptions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and feedback:

- Email: feedback@safeguard.app
- Create an issue in the repository

## Disclaimer

SafeGuard is designed to assist with personal safety but should not be relied upon as the sole safety measure. Always inform trusted contacts about your travel plans and maintain awareness of your surroundings.

---

**Made with ❤️ for solo travelers in Sri Lanka**
