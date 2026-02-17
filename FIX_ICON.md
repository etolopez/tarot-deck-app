# Fix Icon Issue

## Problem
The `assets/icon.png` file is invalid (only 48 bytes). This causes the prebuild to fail.

## Solution

You need to replace `assets/icon.png` with a valid 1024x1024 PNG image.

### Option 1: Create a Simple Icon

1. Open any image editor (Photoshop, GIMP, or online editor)
2. Create a new 1024x1024 image
3. Fill with black background (#000000)
4. Add white text "Tarot" or use a tarot card image
5. Export as PNG
6. Save as `assets/icon.png`

### Option 2: Use an Online Tool

1. Go to https://www.favicon-generator.org/ or similar
2. Upload/create a 1024x1024 image
3. Download and save as `assets/icon.png`

### Option 3: Use Expo's Default (Temporary)

You can temporarily comment out the icon in `app.json`:

```json
// "icon": "./assets/icon.png",
```

But this is not recommended for production.

## After Fixing Icon

Once you have a valid icon:

```bash
# Clean previous build attempts
rm -rf android ios

# Try prebuild again
npx expo prebuild --clean

# Build for Android
npx expo run:android
```

