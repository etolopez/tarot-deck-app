# IAP Build Issues - Workaround Guide

## Current Status

Updated `react-native-iap` to version `^14.6.2` (latest). However, there may still be build issues due to:

1. **Kotlin compilation errors** in react-native-iap (deprecated React Native APIs)
2. **CMake issues** if react-native-nitro-modules is still present

## Try Building Again

```bash
# Clean everything
rm -rf android ios node_modules/.bin

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

## If Build Still Fails

### Option 1: Make IAP Optional (Recommended for MVP)

Since IAP is not critical for MVP testing, we can make it optional:

1. **Update IAP service to handle missing module gracefully:**

```typescript
// In apps/mobile/src/services/iapService.ts
let iapAvailable = false;

export async function initializeIap(): Promise<void> {
  try {
    // Try to import react-native-iap
    const { initConnection } = await import('react-native-iap');
    await initConnection();
    iapAvailable = true;
    logger.info("iap.connected", { connected: true });
  } catch (error) {
    logger.warn("iap.not.available", {
      error: error instanceof Error ? error.message : String(error),
    });
    iapAvailable = false;
  }
}

export function isIapAvailable(): boolean {
  return iapAvailable;
}
```

2. **Update PaywallScreen to hide IAP options if unavailable:**

```typescript
// In apps/mobile/src/app/paywall.tsx
const [iapAvailable, setIapAvailable] = useState(false);

useEffect(() => {
  setIapAvailable(isIapAvailable());
}, []);
```

### Option 2: Use Expo In-App Purchases

Expo has a built-in IAP solution that works better with Expo:

```bash
npm install expo-in-app-purchases
```

Then update the IAP service to use Expo's API instead.

### Option 3: Patch react-native-iap

If you need react-native-iap specifically, you might need to patch the Kotlin code:

1. Install `patch-package`:
   ```bash
   npm install --save-dev patch-package
   ```

2. Fix the Kotlin errors manually in `node_modules/react-native-iap/android/src/play/java/com/dooboolab/rniap/RNIapModule.kt`

3. Create a patch:
   ```bash
   npx patch-package react-native-iap
   ```

4. Add to package.json:
   ```json
   "scripts": {
     "postinstall": "patch-package"
   }
   ```

## Recommended Approach for MVP

**Make IAP optional** - This allows you to:
- Test the app without IAP
- Test Solana payments (which work)
- Add IAP later when you have time to fix compatibility issues

The app will still work, users just won't see IAP options if the module isn't available.

