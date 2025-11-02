# ZYNX AI Mobile App

React Native (Expo) mobile application for ZYNX AI Assistant.

## Features

- **Authentication**: Email/password login and signup
- **24-Hour Trial**: Automatic trial for new users
- **AI Chat**: Real-time chat with AI assistant
- **Subscription**: Stripe integration for payments
- **Chat History**: Persistent message history
- **Export**: Export chat conversations
- **Trial Timer**: Visual indication of trial status

## Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)

## Installation

```bash
# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli
```

## Configuration

Update `app.json` with your API URL:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_BACKEND_URL/api",
      "stripePublishableKey": "pk_test_YOUR_KEY"
    }
  }
}
```

For local development:
- iOS Simulator: Use `http://localhost:3000/api`
- Android Emulator: Use `http://10.0.2.2:3000/api`
- Physical Device: Use your computer's IP address

## Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Building

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview

# Or build locally (requires Android Studio)
npx expo prebuild
cd android
./gradlew assembleRelease
```

### iOS IPA

```bash
# Build IPA (requires Apple Developer account)
eas build --platform ios --profile preview
```

## Project Structure

```
mobile/
├── src/
│   ├── config/          # Configuration
│   │   └── api.ts       # API endpoints
│   ├── context/         # React Context
│   │   └── AuthContext.tsx
│   ├── navigation/      # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/         # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── SubscriptionScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── services/        # API services
│       └── api.service.ts
├── App.tsx              # App entry point
├── app.json             # Expo configuration
├── package.json
└── tsconfig.json
```

## Features Guide

### Authentication
- Email/password signup with validation
- Automatic 24-hour trial activation
- Secure token storage with expo-secure-store
- Automatic token refresh

### Chat
- Real-time AI responses
- Message history
- Typing indicators
- Rate limit handling
- Trial expiry detection

### Subscription
- View available plans
- Stripe checkout integration
- Subscription status display
- Cancel subscription

### Profile
- View account information
- Trial status display
- Export chat history
- Logout

## Testing

### Test Accounts

Use these test accounts (after running backend seed):

```
Email: test1@example.com
Password: password123
Status: Active trial

Email: subscriber@example.com
Password: password123
Status: Active subscription
```

### Test Flow

1. **Signup**: Create new account → Trial starts
2. **Chat**: Send messages → Receive AI responses
3. **Trial Expiry**: Wait or simulate → Chat blocked
4. **Subscribe**: Choose plan → Stripe checkout
5. **Chat Unlocked**: Send messages → Works again

## Troubleshooting

### Cannot connect to backend

```bash
# Check backend is running
curl http://localhost:3000/api/health

# For Android emulator, use:
# http://10.0.2.2:3000/api

# For physical device, use your computer's IP:
# http://192.168.1.XXX:3000/api
```

### Expo Go issues

```bash
# Clear cache
expo start -c

# Reset Metro bundler
npx react-native start --reset-cache
```

### Build errors

```bash
# Clean and rebuild
rm -rf node_modules
npm install
expo prebuild --clean
```

## Environment Variables

The app uses Expo's `extra` configuration in `app.json`:

- `apiUrl`: Backend API URL
- `stripePublishableKey`: Stripe publishable key

## Security

- Tokens stored in secure storage (expo-secure-store)
- Automatic token refresh
- No sensitive data in AsyncStorage
- HTTPS required in production

## License

MIT
