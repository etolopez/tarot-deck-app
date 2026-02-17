# EAS Build Steps - Create Android APK

## Current Status
- ✅ EAS CLI installed
- ✅ Logged in as: `simplyeto`
- ✅ `eas.json` configured
- ✅ Project initialized: `@simplyeto/tarot-deck` (ID: 274523ae-f83c-4eff-b8a1-3d78e3c09384)
- ✅ Project linked and `app.json` updated

## Steps to Build APK

### Step 1: Build Android APK (Run this in your terminal)

**Important:** This command requires interactive input to approve keystore generation.

```bash
cd /Users/eto/Desktop/Tarot_deck
eas build --platform android --profile production
```

**What will happen:**
1. EAS will prompt you to generate a new keystore → Type `y` and press Enter
2. Your project will be uploaded to Expo's servers
3. The build will start in the cloud (~15-20 minutes)
4. You'll receive a download link when complete

**Alternative: Build Preview APK (Faster, for testing)**

```bash
eas build --platform android --profile preview
```

This also requires keystore approval but builds faster for testing purposes.

## Build Options

- **Production**: Full release build, optimized for Play Store
- **Preview**: APK for testing, faster build time
- **Development**: Development client build

## Monitor Build Progress

After starting the build, you can:
- View progress in terminal
- Check status at: https://expo.dev/accounts/simplyeto/projects/tarot-deck/builds
- Download APK from the dashboard when complete

## Expected Build Time

- First build: ~15-20 minutes
- Subsequent builds: ~10-15 minutes

## Troubleshooting

If you encounter issues:
1. Make sure you're logged in: `eas whoami`
2. Check project status: `eas project:info`
3. View build logs: `eas build:list`
