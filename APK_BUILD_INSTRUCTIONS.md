# APK Build Instructions

## Prerequisites

1. **Android Studio** installed
2. **Java JDK** (version 17 recommended)
3. **Node.js** and npm/yarn installed
4. **Expo CLI** installed globally: `npm install -g expo-cli`

## Build APK

### Option 1: Using EAS Build (Recommended)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   eas build:configure
   ```

4. **Build APK**:
   ```bash
   eas build --platform android --profile production
   ```

5. **Download APK**: Once build completes, download from the provided URL

### Option 2: Local Build (Advanced)

1. **Generate Android project**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find APK**: Located at `android/app/build/outputs/apk/release/app-release.apk`

### Option 3: Using Expo Development Build

1. **Create development build**:
   ```bash
   eas build --platform android --profile development
   ```

2. **Install on device**:
   ```bash
   eas build:run -p android
   ```

## Signing APK (Production)

For production releases, you'll need to:

1. **Generate keystore**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('my-release-key.keystore')
               storePassword 'your-password'
               keyAlias 'my-key-alias'
               keyPassword 'your-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

## Important Notes

- **Mainnet Configuration**: The app is configured for Solana mainnet. Ensure your wallet has real SOL for testing.
- **RPC Endpoint**: Consider using a paid RPC service (Helius, QuickNode) for better performance in production.
- **API Base URL**: Update `apiBaseUrl` in `app.json` to your production backend URL.

## Troubleshooting

- If build fails, check Android Studio SDK installation
- Ensure Java JDK 17 is installed and configured
- Check `android/gradle.properties` for correct SDK versions
- Verify all dependencies are installed: `npm install` or `yarn install`
