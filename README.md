# Tarot Reading App - MVP Implementation

A mobile tarot reading application with AI-generated narratives, built with React Native (Expo) and Node.js backend.

## Architecture

This is a monorepo structure with:
- **apps/mobile**: React Native app using Expo Dev Client
- **apps/api**: Node.js/Express backend API

## Features

- **Tarot Readings**: Multiple spread types (1-card, 3-card, Celtic Cross)
- **Credit System**: Pay-per-reading model with local ledger
- **In-App Purchases**: Google Play IAP for credit purchases
- **Solana Payments**: Wallet integration for Android (iOS behind feature flag)
- **AI Narratives**: OpenAI-powered reading interpretations
- **Local Storage**: AsyncStorage for credits and reading history

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- OpenAI API key (for AI narratives)

## Setup

### 1. Install Dependencies

```bash
# Root dependencies (mobile app)
npm install

# Backend API dependencies
cd apps/api
npm install
cd ../..
```

### 2. Configure Backend API

Create `apps/api/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RECIPIENT_ADDRESS=your_solana_address_here
```

### 3. Configure Mobile App

Update `app.json` with your configuration:

```json
{
  "extra": {
    "apiBaseUrl": "http://localhost:3000",
    "solanaRecipientAddress": "your_solana_address",
    "enableSolanaPaymentsAndroid": true,
    "enableSolanaPaymentsIos": false
  }
}
```

### 4. Start Backend API

```bash
cd apps/api
npm run dev
```

The API will run on `http://localhost:3000`

### 5. Start Mobile App

```bash
# From root directory
npm start

# Or for Android
npm run android

# Or for iOS
npm run ios
```

## Project Structure

```
Tarot_deck/
├── apps/
│   ├── mobile/              # React Native app
│   │   └── src/
│   │       ├── app/         # Expo Router screens
│   │       ├── components/  # Reusable components
│   │       ├── core/        # Core logic (TarotEngine, logger)
│   │       ├── data/        # Tarot data (cards.json, spreads.json)
│   │       ├── services/    # IAP, Solana, AI, Credits services
│   │       ├── state/       # Zustand stores
│   │       └── types/       # TypeScript type definitions
│   └── api/                 # Backend API
│       └── src/
│           ├── routes/      # API routes
│           ├── services/    # Business logic
│           ├── middleware/  # Express middleware
│           └── utils/       # Utilities (logger)
├── assets/                  # App assets
├── package.json            # Root package.json
└── app.json               # Expo configuration
```

## Key Components

### Mobile App

- **TarotEngine**: Pure logic for shuffling, drawing cards, building results
- **CreditsService**: Atomic credit operations with ledger
- **IapService**: Google Play IAP integration
- **SolanaService**: Mobile Wallet Adapter integration
- **AiService**: Backend API client for AI narratives

### Backend API

- **POST /v1/ai/reading**: Generates AI narrative from reading data
- **POST /v1/solana/verify-and-grant**: Verifies Solana transactions (optional)

## Development Notes

### IAP Setup

1. Create products in Google Play Console:
   - `tarot_credits_5` (5 credits)
   - `tarot_credits_15` (15 credits)

2. The app uses `react-native-iap` which requires Expo Dev Client (not Expo Go)

### Solana Setup

1. Solana payments are Android-first
2. iOS support is behind a feature flag (default: disabled)
3. Uses Solana Mobile Wallet Adapter (MWA) for wallet connection
4. Configure `SOLANA_RECIPIENT_ADDRESS` in app.json

### AI Narratives

1. Requires OpenAI API key in backend `.env`
2. Uses GPT-4o-mini by default (configurable)
3. All AI calls go through backend (never from mobile)

## Testing

### MVP Acceptance Criteria

1. ✅ User can run Android app, select spread, draw cards, see meanings
2. ✅ Credits gate works: reading cannot start without credits
3. ✅ IAP purchase grants credits (placeholder implementation)
4. ✅ Solana pay connects wallet and sends transfer (placeholder)
5. ✅ AI narrative call returns text and displays on ResultScreen
6. ✅ Logs show end-to-end flow with request IDs

## Debug Panel

Long-press the "Settings" title to reveal debug panel showing:
- Current balance
- Recent ledger entries
- Wallet connection status
- API configuration
- Feature flags

## Logging

- **Mobile**: Custom logger with structured JSON output
- **Backend**: Pino logger with HTTP request logging
- All logs include context and request IDs for debugging

## Next Steps

1. Implement actual IAP purchase flow (currently placeholder)
2. Implement actual Solana transaction signing (currently placeholder)
3. Add reading history persistence
4. Add card images
5. Enhance UI/UX
6. Add unit tests
7. Add E2E tests

## License

UNLICENSED - Private project

## Author

Roberto Lopez J. (@simplyeto)
