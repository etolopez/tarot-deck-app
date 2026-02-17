# Build Errors Fix

## Current Issues

1. **react-native-nitro-modules CMake Error**: Can't find React Native targets
2. **react-native-iap Kotlin Errors**: `currentActivity` unresolved reference

## Solutions

### Option 1: Update react-native-iap (Recommended)

I've updated `react-native-iap` from `^12.9.3` to `^13.2.0` and removed `react-native-nitro-modules` (which was causing CMake issues).

**Next steps:**
```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Reinstall with updated versions
npm install

# Clean Android build
rm -rf android ios

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

### Option 2: Make IAP Optional (Temporary)

If the update doesn't work, you can temporarily disable IAP to get the build working:

1. **Remove IAP from package.json temporarily:**
   ```json
   // Comment out or remove:
   // "react-native-iap": "^13.2.0",
   ```

2. **Update IAP service to handle missing module:**
   ```typescript
   // In apps/mobile/src/services/iapService.ts
   // Add try-catch around imports
   ```

3. **Rebuild without IAP:**
   ```bash
   rm -rf android ios node_modules
   npm install
   npx expo prebuild --clean
   npx expo run:android
   ```

### Option 3: Use Expo In-App Purchases (Alternative)

Expo has its own IAP solution that might work better:

```bash
npm install expo-in-app-purchases
```

Then update the IAP service to use `expo-in-app-purchases` instead of `react-native-iap`.

## Why These Errors Occur

- **react-native-nitro-modules**: This is a C++ native module that has compatibility issues with newer React Native versions and Expo SDK 54
- **react-native-iap**: Version 12.9.3 has Kotlin code that references deprecated React Native APIs (`currentActivity`)

## Recommended Action

Try Option 1 first (updating to react-native-iap 13.2.0). If that doesn't work, we can:
1. Check for Expo-compatible IAP solutions
2. Make IAP optional for MVP
3. Use a different IAP library

