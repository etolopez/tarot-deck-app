# Installing the Tarot APK on Android

## If you see "App not installed" or "Conflict with existing app"

Android blocks installing an APK when **another app with the same package name** (`com.tarotreading.app`) is already installed but was **signed with a different key**. That usually means:

- You previously installed a **debug** or **development** build (e.g. from `expo start --android` or a dev client), or  
- You had an older **release** build signed with a different keystore.

### Fix

1. **Uninstall the existing app** from your phone:
   - Settings → Apps → find **"Tarot"** or **"Tarot Deck"** → Uninstall  
   - Or long‑press the app icon → App info → Uninstall  

2. **Install the new APK** (the one you downloaded from EAS or your build link).

After that, the new build should install without conflict. Future updates from the same signing key will install over the existing app as normal.
