# Icon Replacement Instructions

## Current Status

The `assets/icon.png` file is currently a text placeholder. You need to replace it with a valid PNG image.

## Requirements

- **Size:** 1024x1024 pixels (square)
- **Format:** PNG
- **File name:** `icon.png`
- **Location:** `assets/icon.png`

## How to Create/Replace Icon

### Option 1: Use an Image Editor

1. Open Photoshop, GIMP, Figma, or any image editor
2. Create new image: 1024x1024 pixels
3. Design your icon (tarot-themed, app logo, etc.)
4. Export as PNG
5. Save as `assets/icon.png` (replace the existing file)

### Option 2: Use Online Tools

1. **Figma** (free): https://www.figma.com

   - Create 1024x1024 frame
   - Design icon
   - Export as PNG

2. **Canva** (free): https://www.canva.com

   - Create 1024x1024 design
   - Download as PNG

3. **Favicon Generator**: https://www.favicon-generator.org/
   - Upload image or create new
   - Download 1024x1024 version

### Option 3: Use a Simple Placeholder (Temporary)

For quick testing, you can create a simple black square with text:

```bash
# Using ImageMagick (if installed)
convert -size 1024x1024 xc:black -pointsize 200 -fill white -gravity center -annotate +0+0 "Tarot" assets/icon.png

# Or use any online placeholder service
```

## After Replacing Icon

1. **Uncomment the icon in app.json:**

   ```json
   "icon": "./assets/icon.png",
   ```

2. **Clean and rebuild:**
   ```bash
   rm -rf android ios
   npx expo prebuild --clean
   npx expo run:android
   ```

## Current Workaround

I've temporarily commented out the icon requirement in `app.json` so you can build the app. Once you have a valid icon:

1. Replace `assets/icon.png` with your 1024x1024 PNG
2. Uncomment the icon line in `app.json`
3. Rebuild the app
