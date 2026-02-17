# Card Images Setup Guide

## Overview
The app now uses card images from the `Cards-jpg` folder. The images are mapped to cards using the naming convention in the folder.

## Image Naming Convention

### Major Arcana
- Format: `00-TheFool.jpg`, `01-TheMagician.jpg`, etc.
- Number is zero-padded (00-21)
- Name has no spaces, no "The " prefix in filename

### Minor Arcana
- Format: `Cups01.jpg`, `Swords01.jpg`, `Wands01.jpg`, `Pentacles01.jpg`
- Suit name is capitalized
- Number is zero-padded (01-14)

### Card Back
- `CardBacks.jpg`

## Setup Instructions

### Option 1: Move to Assets Folder (Recommended for Production)

1. Move the `Cards-jpg` folder to `apps/mobile/assets/`:
   ```bash
   mv Cards-jpg apps/mobile/assets/Cards-jpg
   ```

2. Update `app.json` to include the folder in asset bundle:
   ```json
   "assetBundlePatterns": [
     "**/*",
     "Cards-jpg/**/*"
   ]
   ```

3. Rebuild the app:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

### Option 2: Keep at Root (Development)

If keeping `Cards-jpg` at the project root:

1. Ensure `app.json` includes it in `assetBundlePatterns` (already done)
2. The images will be accessible via the path `Cards-jpg/{filename}.jpg`
3. For production builds, you may need to move to assets folder

## Image Mapping

The `cardImageMapper.ts` utility automatically maps:
- Card IDs → Image filenames
- Handles major arcana name formatting
- Handles minor arcana suit/number formatting

## Usage in Code

```typescript
import { getCardImagePath, getCardBackImagePath } from "../utils/cardImageMapper";

const imagePath = getCardImagePath(card); // Returns "00-TheFool.jpg"
const backPath = getCardBackImagePath(); // Returns "CardBacks.jpg"
```

## Testing

After setup, the reading screen should display:
- Card back images for unrevealed cards
- Actual card images when cards are revealed
- Reversed cards will be rotated 180 degrees

## Troubleshooting

If images don't appear:
1. Check that `Cards-jpg` folder exists and contains all images
2. Verify image filenames match the naming convention exactly
3. Check Metro bundler logs for asset loading errors
4. Try moving images to `apps/mobile/assets/Cards-jpg` and rebuilding

