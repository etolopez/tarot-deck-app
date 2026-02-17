# Android Build Fix for react-native-iap

## Problem

The build was failing with this error:
```
Could not resolve project :react-native-iap
The consumer cannot choose between the following variants:
  - amazonDebugApiElements
  - playDebugApiElements
```

This happens because `react-native-iap` has multiple product flavors (amazon and play) and Gradle doesn't know which one to use.

## Solution

Added `missingDimensionStrategy` to the `defaultConfig` in `android/app/build.gradle`:

```gradle
defaultConfig {
    // ... other config ...
    missingDimensionStrategy "store", "play"
}
```

This tells Gradle to use the "play" variant (Google Play Store) when resolving dependencies.

## Try Building Again

```bash
# Clean and rebuild
rm -rf android ios
npx expo prebuild --clean
npx expo run:android
```

## Alternative: If You Need Amazon App Store

If you need to support Amazon App Store, you would need to create product flavors:

```gradle
flavorDimensions "store"
productFlavors {
    play {
        dimension "store"
    }
    amazon {
        dimension "store"
    }
}
```

But for most use cases, using `missingDimensionStrategy` with "play" is sufficient.

