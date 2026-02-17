# Quick Fix for Current Issues

## Issue 1: Invalid Icon File

Your `assets/icon.png` is corrupted (48 bytes, detected as ASCII text).

**Immediate Fix:**
1. Delete the current icon: `rm assets/icon.png`
2. Create or download a 1024x1024 PNG image
3. Save it as `assets/icon.png`

**Temporary Workaround (for testing only):**
You can temporarily remove the icon requirement by editing `app.json`:

```json
{
  "expo": {
    // Comment out or remove this line temporarily:
    // "icon": "./assets/icon.png",
```

## Issue 2: No Development Build Installed

The error "No development build (com.tarotreading) for this project is installed" means you need to build and install the app first.

### Steps to Fix:

1. **Fix the icon first** (see Issue 1 above)

2. **Clean previous build attempts:**
   ```bash
   rm -rf android ios
   ```

3. **Build the development build:**
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

4. **Authorize your computer on Android device:**
   - When prompted on your device, tap "Allow"
   - Check "Always allow from this computer"

5. **Start the dev server:**
   ```bash
   npm run start
   # Then press 'a' for Android
   ```

## Alternative: Test in Expo Go (Limited Features)

If you just want to test basic functionality (without Solana/IAP):

```bash
npm run start
# Press 's' to switch to Expo Go
# Scan QR code with Expo Go app
```

**Note:** Solana payments and IAP won't work in Expo Go - you need a development build for those features.

## Recommended Next Steps

1. ✅ Fix the icon file (create/download 1024x1024 PNG)
2. ✅ Clean build directories: `rm -rf android ios`
3. ✅ Run prebuild: `npx expo prebuild --clean`
4. ✅ Build and install: `npx expo run:android`
5. ✅ Start dev server: `npm run start`
6. ✅ Press 'a' to open on Android

