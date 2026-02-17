# Build Instructions for Tarot Deck App

## Issue: Icon File Problem

The current `assets/icon.png` file is invalid (only 48 bytes). You need to replace it with a valid PNG image.

### Quick Fix Options:

1. **Replace the icon file:**
   - Create or download a 1024x1024 PNG image
   - Save it as `assets/icon.png`
   - The image should be square and at least 1024x1024 pixels

2. **Temporary workaround (skip icon for now):**
   ```bash
   # Remove icon temporarily from app.json
   # Or use a placeholder service like https://via.placeholder.com/1024
   ```

## Building Development Build for Android

Since this app uses native modules (Solana MWA, IAP), you need a **development build**, not Expo Go.

### Step 1: Fix Icon Issue First

Replace `assets/icon.png` with a valid 1024x1024 PNG image.

### Step 2: Clean Previous Build Attempts

```bash
# Remove any corrupted native directories
rm -rf android ios
```

### Step 3: Build Development Build

**Option A: Local Build (Recommended for Development)**

```bash
# Make sure you have Android Studio and Android SDK installed
# Then run:
npx expo prebuild --clean
npx expo run:android
```

**Option B: EAS Build (Cloud Build)**

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (if not already done)
eas build:configure

# Build for Android
eas build --platform android --profile development
```

### Step 4: Install on Device

**For Local Build:**
- The `npx expo run:android` command should automatically install on your connected device
- Make sure USB debugging is enabled on your Android device
- Authorize your computer when prompted

**For EAS Build:**
- Download the APK from the build page
- Install it on your device manually
- Or use the QR code to install directly

### Step 5: Authorize Android Device

If you see "This computer is not authorized":
1. On your Android device, when the authorization prompt appears, tap "Allow"
2. Or enable USB debugging in Developer Options
3. Check "Always allow from this computer"

### Step 6: Start Development Server

```bash
# In the project root
npm run start

# Then press 'a' to open on Android
# The app should connect to your development build
```

## Troubleshooting

### Icon Error During Prebuild

If you still get the icon error:
1. Verify the icon file is a valid PNG: `file assets/icon.png` should show "PNG image"
2. Check file size: should be at least a few KB, not 48 bytes
3. Try regenerating: Use an image editor to create a 1024x1024 PNG

### "No development build installed" Error

This means:
- You haven't built and installed the development build yet
- Or the installed build doesn't match your project

Solution:
1. Build the development build first (see Step 3 above)
2. Install it on your device
3. Then start the dev server

### Device Authorization Issues

1. Enable Developer Options on Android:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Authorize computer when prompted

### Alternative: Use Expo Go (Limited)

**Note:** Expo Go won't work for Solana payments or IAP, but you can test basic functionality:

```bash
npm run start
# Press 's' to switch to Expo Go mode
# Then scan QR code with Expo Go app
```

## Quick Start Checklist

- [ ] Replace `assets/icon.png` with valid 1024x1024 PNG
- [ ] Install Android Studio and Android SDK
- [ ] Enable USB debugging on Android device
- [ ] Connect Android device via USB
- [ ] Run `npx expo prebuild --clean`
- [ ] Run `npx expo run:android`
- [ ] Authorize computer on device when prompted
- [ ] Start dev server: `npm run start`
- [ ] Press 'a' to open on Android

## Next Steps After Build

Once the development build is installed:
1. Start backend API: `cd apps/api && npm run dev`
2. Start mobile app: `npm run start`
3. Test the app on your device
4. Solana payments will work (requires Phantom wallet on device)

