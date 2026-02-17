# Setup Guide - Tarot Reading App

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (mobile app)
npm install

# Install backend API dependencies
cd apps/api
npm install
cd ../..
```

### 2. Backend Setup

1. Create `apps/api/.env` file:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

2. Start the backend:

```bash
cd apps/api
npm run dev
```

The API will be available at `http://localhost:3000`

### 3. Mobile App Setup

1. Update `app.json` if needed:

```json
{
  "extra": {
    "apiBaseUrl": "http://localhost:3000",
    "solanaRecipientAddress": "",
    "enableSolanaPaymentsAndroid": true,
    "enableSolanaPaymentsIos": false
  }
}
```

2. For Android development, update the API URL to your machine's IP:

```json
{
  "extra": {
    "apiBaseUrl": "http://192.168.1.X:3000"
  }
}
```

3. Start the mobile app:

```bash
# From root directory
npm start

# Then press 'a' for Android or 'i' for iOS
```

## Development Build

Since this app uses native modules (IAP, Solana MWA), you need Expo Dev Client:

```bash
# Build development client
npx expo prebuild

# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## Testing the App

### 1. Test Credit System

- Start with 0 credits
- Try to start a reading (should show paywall)
- Use debug panel to grant test credits

### 2. Test Reading Flow

1. Select a spread (1-card or 3-card)
2. Optionally enter a question
3. Toggle AI narrative on/off
4. Start reading
5. View results

### 3. Test IAP (Placeholder)

- IAP is currently a placeholder
- In production, set up products in Google Play Console
- SKUs: `tarot_credits_5`, `tarot_credits_15`

### 4. Test Solana (Placeholder)

- Solana payments are Android-only by default
- Currently a placeholder implementation
- Requires Solana Mobile Wallet Adapter compatible wallet

### 5. Test AI Narratives

- Requires backend API running
- Requires valid OpenAI API key
- AI narrative appears on result screen if enabled

## Debug Panel

To access debug panel:
1. Go to Settings screen
2. Long-press on "Settings" title
3. Debug panel will appear showing:
   - Current balance
   - Recent ledger entries
   - Wallet connection status
   - API configuration
   - Feature flags

## Common Issues

### Backend not connecting

- Check that backend is running on correct port
- For Android emulator, use `10.0.2.2:3000` instead of `localhost:3000`
- For physical device, use your computer's IP address

### IAP not working

- IAP requires Expo Dev Client (not Expo Go)
- Products must be set up in Google Play Console
- App must be signed with release key for production

### Solana wallet not connecting

- Requires Solana Mobile Wallet Adapter compatible wallet
- Android-only by default (iOS behind feature flag)
- Check feature flags in app.json

### AI narratives not generating

- Check OpenAI API key in backend `.env`
- Check backend logs for errors
- Verify API base URL in app.json

## Next Steps for Production

1. Set up Google Play Console for IAP
2. Configure Solana mainnet addresses
3. Set up proper error monitoring
4. Add analytics
5. Implement reading history persistence
6. Add card images
7. Enhance UI/UX

