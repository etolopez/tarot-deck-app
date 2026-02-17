# Solana Integration Guide

**Complete guide for integrating Solana payments and wallet connections in React Native (Expo) applications**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Dependencies](#dependencies)
4. [Configuration](#configuration)
5. [Polyfills Setup](#polyfills-setup)
6. [Wallet Connection](#wallet-connection)
7. [Payment Processing](#payment-processing)
8. [Transaction Verification](#transaction-verification)
9. [Error Handling](#error-handling)
10. [Code Examples](#code-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This guide documents how to integrate Solana blockchain functionality into a React Native application using:

- **Mobile Wallet Adapter (MWA)** for Android wallet connections
- **@solana/web3.js** for blockchain interactions
- **@solana/spl-token** for USDC token payments
- **Backend verification** for secure payment validation

### Key Features

- ✅ Wallet connection via Mobile Wallet Adapter (Android)
- ✅ SOL payments (native Solana currency)
- ✅ USDC payments (SPL token)
- ✅ Transaction verification on backend
- ✅ Support for both devnet and mainnet
- ✅ Comprehensive error handling
- ✅ Retry logic for RPC rate limits

---

## Prerequisites

### Required

- **React Native / Expo** project (Expo SDK 54+)
- **Android Dev Client** (not Expo Go - MWA requires native modules)
- **Phantom Wallet** or compatible Solana wallet installed on Android device
- **Node.js** 18+ for backend

### Platform Support

- ✅ **Android** (via Mobile Wallet Adapter)
- ❌ **iOS** (not supported - MWA is Android-only)
- ❌ **Web** (not supported - requires native wallet integration)

---

## Dependencies

### Frontend Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@solana-mobile/mobile-wallet-adapter-protocol": "^2.2.5",
    "@solana/spl-token": "^0.4.14",
    "@solana/web3.js": "^1.98.4",
    "bs58": "^6.0.0",
    "buffer": "^6.0.3",
    "react-native-get-random-values": "~1.11.0",
    "react-native-url-polyfill": "^1.3.0",
    "expo-dev-client": "~6.0.20",
    "expo-constants": "~18.0.10"
  }
}
```

### Backend Dependencies

Add these to your backend `package.json`:

```json
{
  "dependencies": {
    "@solana/web3.js": "^1.87.6",
    "bs58": "^6.0.0",
    "dotenv": "^16.3.1"
  }
}
```

### Installation

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

---

## Configuration

### Frontend Configuration

Create `src/config/solana.ts`:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Solana cluster configuration
 * Set via EXPO_PUBLIC_SOLANA_CLUSTER environment variable
 * Options: 'devnet' | 'mainnet-beta'
 * Default: 'mainnet-beta'
 */
export const CLUSTER: 'devnet' | 'mainnet-beta' = 
  (process.env.EXPO_PUBLIC_SOLANA_CLUSTER as any) || 'mainnet-beta';

/**
 * Solana RPC endpoint
 * Set via EXPO_PUBLIC_SOLANA_RPC environment variable
 * Defaults to public RPC based on cluster
 */
export const SOLANA_RPC = process.env.EXPO_PUBLIC_SOLANA_RPC || 
  (CLUSTER === 'devnet' 
    ? 'https://api.devnet.solana.com' 
    : 'https://api.mainnet-beta.solana.com');

/**
 * On-chain verification program ID (optional)
 * Set via EXPO_PUBLIC_VERIFY_PROGRAM_ID environment variable
 * Leave empty to disable on-chain verification
 */
export const PROGRAM_ID_STR = process.env.EXPO_PUBLIC_VERIFY_PROGRAM_ID || '';

let parsedProgram: PublicKey | null = null;
try {
  parsedProgram = PROGRAM_ID_STR ? new PublicKey(PROGRAM_ID_STR) : null;
} catch {}
export const PROGRAM_ID = parsedProgram;

/**
 * Get Solana connection instance
 */
export function getConnection(): Connection {
  return new Connection(SOLANA_RPC, 'confirmed');
}

/**
 * Find verification PDA (Program Derived Address)
 * Used for on-chain wallet verification
 */
export function findVerificationPda(owner: PublicKey) {
  if (!PROGRAM_ID) throw new Error('Verification program ID not set');
  return PublicKey.findProgramAddressSync(
    [Buffer.from('verify'), owner.toBuffer()], 
    PROGRAM_ID
  );
}

/**
 * Get USDC mint address based on cluster
 * Mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 * Devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 */
export function getUSDCMintAddress(): string {
  if (CLUSTER === 'devnet') {
    return '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  }
  return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
}
```

### Environment Variables (Frontend)

Create `.env` or set in your build configuration:

```bash
# Solana Cluster (devnet or mainnet-beta)
EXPO_PUBLIC_SOLANA_CLUSTER=mainnet-beta

# Optional: Custom RPC endpoint (recommended for production)
EXPO_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Optional: On-chain verification program ID
EXPO_PUBLIC_VERIFY_PROGRAM_ID=
```

### Backend Configuration

Create `backend/src/config/solana.js`:

```javascript
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER);

export const connection = new Connection(RPC_URL, 'confirmed');

// Log RPC configuration (for debugging)
if (process.env.NODE_ENV !== 'production' || process.env.LOG_RPC_CONFIG === 'true') {
  console.log('[Solana] RPC Configuration:', {
    cluster: CLUSTER,
    rpcUrl: RPC_URL?.substring(0, 60) + (RPC_URL?.length > 60 ? '...' : ''),
    hasCustomRpc: !!process.env.SOLANA_RPC_URL,
  });
}
```

### Environment Variables (Backend)

Set these in your backend environment (e.g., Railway, Heroku):

```bash
# Solana Cluster
SOLANA_CLUSTER=mainnet-beta

# RPC Endpoint (recommended: use Helius, QuickNode, or Alchemy)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Platform payment address (receives payments)
PLATFORM_PAYMENT_ADDRESS=YOUR_PLATFORM_WALLET_ADDRESS
```

### RPC Provider Recommendations

**For Production:**
- **Helius** (https://www.helius.dev/) - Free tier available
- **QuickNode** (https://www.quicknode.com/) - Free tier available
- **Alchemy** (https://www.alchemy.com/) - Free tier available

**Why use a paid RPC?**
- Higher rate limits
- Better reliability
- Faster transaction indexing
- Production-ready infrastructure

---

## Polyfills Setup

**Critical:** Solana libraries require polyfills for React Native. Create `src/polyfills.ts`:

```typescript
// Polyfills for Solana web3 + wallet adapter in React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Buffer - Must be set up before any modules that use it
import { Buffer } from 'buffer';

// @ts-ignore
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Also set on global for compatibility
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}
```

**Import polyfills first** in your app entry point (e.g., `src/app/_layout.tsx`):

```typescript
import '../polyfills'; // Must be first!
// ... other imports
```

---

## Wallet Connection

### Wallet Service

Create `src/services/wallet.service.ts`:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getConnection, CLUSTER } from '../config/solana';

export type WalletAccount = { address: string };

/**
 * Convert wallet address to PublicKey
 * Handles both base58 and base64 encoded addresses from Mobile Wallet Adapter
 */
function addressToPublicKey(address: string): PublicKey {
  if (!address || typeof address !== 'string') {
    throw new Error(`Invalid address: ${address}. Expected a string.`);
  }

  try {
    // Try direct conversion first (base58 - standard Solana address format)
    return new PublicKey(address);
  } catch (e) {
    // If that fails, try converting from base64
    // Mobile Wallet Adapter may return base64 encoded public key bytes
    try {
      const cleanBase64 = address.replace(/[^A-Za-z0-9+/=]/g, '');
      const base64Decoded = Buffer.from(cleanBase64, 'base64');
      
      if (base64Decoded.length !== 32) {
        throw new Error(`Invalid address length: ${base64Decoded.length} bytes. Expected 32 bytes.`);
      }
      
      return new PublicKey(base64Decoded);
    } catch (e2) {
      throw new Error(`Invalid address format: ${address.substring(0, 20)}...`);
    }
  }
}

export class WalletService {
  private static readonly APP_IDENTITY = {
    name: 'Your App Name',
    uri: 'https://yourapp.com',
    icon: 'favicon.ico',
  } as const;

  /**
   * Assert that we're running on Android Dev Client
   */
  private assertDevClientAndroid() {
    const ownership = (Constants as any)?.appOwnership as string | undefined;
    if (Platform.OS !== 'android') {
      throw new Error('Solana wallet requires Android (Mobile Wallet Adapter).');
    }
    if (ownership === 'expo') {
      throw new Error('Requires Android Dev Client or standalone build — not Expo Go.');
    }
  }

  /**
   * Connect wallet and verify ownership
   * Returns wallet address in base58 format
   */
  async verifyOnce(): Promise<WalletAccount> {
    try {
      this.assertDevClientAndroid();
      
      // Lazy import to avoid issues in Expo Go
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      
      const res = await transact(async (wallet: any) => {
        // Authorize with cluster - opens wallet picker
        const { accounts } = await wallet.authorize({ 
          cluster: CLUSTER, 
          identity: WalletService.APP_IDENTITY as any,
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet authorization');
        }
        
        const account = accounts[0];
        let address = typeof account === 'string' 
          ? account 
          : (account?.address || account?.publicKey || account);
        
        if (!address || typeof address !== 'string') {
          throw new Error('Invalid account format returned from wallet');
        }
        
        // Convert to base58 format (standard Solana address format)
        const publicKey = addressToPublicKey(address);
        address = publicKey.toBase58();
        
        return { address };
      });
      
      if (!res || !res.address) {
        throw new Error('Invalid response from wallet verification');
      }
      
      return res as WalletAccount;
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      
      // Handle cancellation errors
      if (lc.includes('cancel') || lc.includes('reject')) {
        throw new Error('Wallet connection was cancelled. Please try again.');
      }
      
      if (lc.includes('timeout')) {
        throw new Error('Connection timed out. Please try again.');
      }
      
      throw new Error(`Wallet verification failed: ${errorMsg}`);
    }
  }
}

export const walletService = new WalletService();
```

### Usage Example

```typescript
import { walletService } from '../services/wallet.service';

// Connect wallet
try {
  const account = await walletService.verifyOnce();
  console.log('Connected wallet:', account.address);
  // Store address in your app state
} catch (error) {
  console.error('Wallet connection failed:', error);
}
```

---

## Payment Processing

### Payment Service

Create `src/services/payment.service.ts` with the following key functions:

#### 1. SOL Payment

```typescript
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection, CLUSTER } from '../config/solana';

export class PaymentService {
  private static readonly APP_IDENTITY = {
    name: 'Your App Name',
    uri: 'https://yourapp.com',
    icon: 'favicon.ico',
  } as const;

  /**
   * Convert base64 signature to base58 (Solana format)
   * Mobile Wallet Adapter returns signatures as base64
   */
  private base64ToBase58(base64Sig: string): string {
    try {
      const base64Chars = /[+/=]/;
      if (!base64Chars.test(base64Sig)) {
        return base64Sig; // Already base58
      }
      const bytes = Buffer.from(base64Sig, 'base64');
      return bs58.encode(bytes);
    } catch (error) {
      return base64Sig; // Return as-is if conversion fails
    }
  }

  /**
   * Convert Uint8Array or Buffer to base64 string
   */
  private toBase64(data: Uint8Array | Buffer): string {
    if (Buffer.isBuffer(data)) {
      return data.toString('base64');
    }
    return Buffer.from(data).toString('base64');
  }

  /**
   * Pay with SOL (native Solana currency)
   * @param recipientAddress - Address to receive payment
   * @param amountSol - Amount in SOL (e.g., 0.1)
   * @param payerAddress - Optional: verify payer matches this address
   * @returns Transaction signature
   */
  async payToCreateGroup(
    recipientAddress: string, 
    amountSol: number, 
    payerAddress?: string
  ): Promise<string> {
    // Assert Android Dev Client
    if (Platform.OS !== 'android') {
      throw new Error('Solana payments require Android (Mobile Wallet Adapter).');
    }

    try {
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const connection = getConnection();
      
      const res = await transact(async (wallet: any) => {
        // 1. Authorize wallet
        const { accounts } = await wallet.authorize({ 
          cluster: CLUSTER, 
          identity: PaymentService.APP_IDENTITY as any 
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet authorization');
        }

        const account = accounts[0];
        const finalPayerAddress = typeof account === 'string' 
          ? account 
          : (account.address || account.publicKey || account);
        
        // Verify payer if provided
        if (payerAddress) {
          const providedPayer = new PublicKey(payerAddress);
          const authorizedPayer = new PublicKey(finalPayerAddress);
          if (!providedPayer.equals(authorizedPayer)) {
            throw new Error('Authorized wallet does not match the provided payer address');
          }
        }
        
        const payer = new PublicKey(finalPayerAddress);
        const recipient = new PublicKey(recipientAddress);

        // 2. Build transfer instruction
        const amountLamports = amountSol * LAMPORTS_PER_SOL;
        const transferIx = SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: recipient,
          lamports: amountLamports,
        });

        // 3. Build transaction
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        const tx = new Transaction({ 
          feePayer: payer, 
          recentBlockhash: blockhash 
        }).add(transferIx);

        // 4. Serialize to base64 (required by Mobile Wallet Adapter)
        const serializedTx = tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        const base64Tx = this.toBase64(serializedTx);

        // 5. Sign and send transaction
        const signedTxs = await wallet.signAndSendTransactions({ 
          payloads: [base64Tx]
        });

        // 6. Extract signature
        let signature: string | null = null;
        if (signedTxs && typeof signedTxs === 'object' && 'signatures' in signedTxs) {
          const sigs = (signedTxs as any).signatures;
          if (Array.isArray(sigs) && sigs.length > 0) {
            signature = sigs[0];
          }
        } else if (Array.isArray(signedTxs) && signedTxs.length > 0) {
          signature = typeof signedTxs[0] === 'string' 
            ? signedTxs[0] 
            : signedTxs[0].signature || '';
        } else if (typeof signedTxs === 'string') {
          signature = signedTxs;
        }
        
        if (!signature) {
          throw new Error('No transaction signature returned from wallet');
        }

        // 7. Convert base64 signature to base58
        signature = this.base64ToBase58(signature);

        // 8. Confirm transaction
        await connection.confirmTransaction(signature, 'confirmed');
        
        return signature;
      });
      
      return res as string;
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      
      if (errorMsg.includes('cancel')) {
        throw new Error('Payment was cancelled. Please try again.');
      }
      
      throw new Error(`Payment failed: ${errorMsg}`);
    }
  }
}
```

#### 2. USDC Payment

```typescript
import { getUSDCMintAddress } from '../config/solana';

/**
 * Pay with USDC (SPL token)
 * @param recipientAddress - Address to receive payment
 * @param amountUSDC - Amount in USDC (e.g., 6.9)
 * @param payerAddress - Optional: verify payer matches this address
 * @returns Transaction signature
 */
async payToCreateGroupUSDC(
  recipientAddress: string, 
  amountUSDC: number, 
  payerAddress?: string
): Promise<string> {
  // Assert Android Dev Client
  if (Platform.OS !== 'android') {
    throw new Error('Solana payments require Android (Mobile Wallet Adapter).');
  }

  try {
    const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
    const connection = getConnection();
    
    const res = await transact(async (wallet: any) => {
      // 1. Authorize wallet
      const { accounts } = await wallet.authorize({ 
        cluster: CLUSTER, 
        identity: PaymentService.APP_IDENTITY as any 
      });
      
      const account = accounts[0];
      const finalPayerAddress = typeof account === 'string' 
        ? account 
        : (account.address || account.publicKey || account);
      
      const payer = new PublicKey(finalPayerAddress);
      const recipient = new PublicKey(recipientAddress);
      const usdcMint = new PublicKey(getUSDCMintAddress());

      // 2. Import SPL token functions (lazy import)
      const splToken = await import('@solana/spl-token');
      const getAssociatedTokenAddressSync = splToken.getAssociatedTokenAddressSync;
      const createTransferInstruction = splToken.createTransferInstruction;
      const TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID;

      // 3. Get associated token addresses
      const payerTokenAccount = getAssociatedTokenAddressSync(usdcMint, payer);
      const recipientTokenAccount = getAssociatedTokenAddressSync(usdcMint, recipient);

      // 4. Check payer balance
      const payerAccountInfo = await connection.getAccountInfo(payerTokenAccount);
      if (!payerAccountInfo) {
        throw new Error('You do not have a USDC token account. Please receive some USDC first.');
      }

      const payerTokenAccountData = await connection.getTokenAccountBalance(payerTokenAccount);
      const payerBalanceDecimals = payerTokenAccountData.value.amount;
      
      // USDC uses 6 decimals
      const amountUSDCWithDecimals = Math.floor(amountUSDC * 1_000_000);
      
      if (payerBalanceDecimals < amountUSDCWithDecimals) {
        const payerBalanceUSDC = payerTokenAccountData.value.uiAmount || 0;
        throw new Error(
          `Insufficient USDC balance. You have ${payerBalanceUSDC.toFixed(2)} USDC, ` +
          `but need ${amountUSDC} USDC.`
        );
      }

      // 5. Build instructions
      const instructions: TransactionInstruction[] = [];
      
      // Check if recipient token account exists
      const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
      if (!recipientAccountInfo) {
        // Create recipient token account if it doesn't exist
        const createAssociatedTokenAccountInstruction = 
          (splToken as any).createAssociatedTokenAccountInstruction;
        if (createAssociatedTokenAccountInstruction) {
          const createAccountIx = createAssociatedTokenAccountInstruction(
            payer,
            recipient,
            usdcMint,
            TOKEN_PROGRAM_ID
          );
          instructions.push(createAccountIx);
        }
      }

      // Create transfer instruction
      const transferIx = createTransferInstruction(
        payerTokenAccount,      // source
        recipientTokenAccount,  // destination
        payer,                  // owner
        amountUSDCWithDecimals, // amount (in smallest unit)
        [],                     // multiSigners
        TOKEN_PROGRAM_ID        // token program
      );
      instructions.push(transferIx);

      // 6. Build transaction
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash });
      instructions.forEach(ix => tx.add(ix));

      // 7. Serialize to base64
      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = this.toBase64(serializedTx);

      // 8. Sign and send
      const signedTxs = await wallet.signAndSendTransactions({ 
        payloads: [base64Tx]
      });

      // 9. Extract and convert signature
      let signature: string | null = null;
      if (signedTxs && typeof signedTxs === 'object' && 'signatures' in signedTxs) {
        const sigs = (signedTxs as any).signatures;
        if (Array.isArray(sigs) && sigs.length > 0) {
          signature = sigs[0];
        }
      } else if (Array.isArray(signedTxs) && signedTxs.length > 0) {
        signature = typeof signedTxs[0] === 'string' 
          ? signedTxs[0] 
          : signedTxs[0].signature || '';
      }
      
      if (!signature) {
        throw new Error('No transaction signature returned from wallet');
      }

      signature = this.base64ToBase58(signature);

      // 10. Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    });
    
    return res as string;
  } catch (e: any) {
    const errorMsg = e?.message || e?.toString() || 'Unknown error';
    
    if (errorMsg.includes('cancel')) {
      throw new Error('Payment was cancelled. Please try again.');
    }
    
    if (errorMsg.includes('Insufficient USDC')) {
      throw e; // Re-throw with original message
    }
    
    throw new Error(`USDC payment failed: ${errorMsg}`);
  }
}
```

### Usage Examples

```typescript
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

// SOL Payment
try {
  const signature = await paymentService.payToCreateGroup(
    'RECIPIENT_ADDRESS',
    0.1, // 0.1 SOL
    'PAYER_ADDRESS' // optional
  );
  console.log('Payment successful:', signature);
} catch (error) {
  console.error('Payment failed:', error);
}

// USDC Payment
try {
  const signature = await paymentService.payToCreateGroupUSDC(
    'RECIPIENT_ADDRESS',
    6.9, // 6.9 USDC
    'PAYER_ADDRESS' // optional
  );
  console.log('USDC payment successful:', signature);
} catch (error) {
  console.error('USDC payment failed:', error);
}
```

---

## Transaction Verification

### Backend Verification

Create `backend/src/config/solana.js` with verification functions:

```javascript
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER);

export const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Verify a payment transaction
 * @param {string} signature - Transaction signature (base58 encoded)
 * @param {string} expectedRecipient - Expected recipient address
 * @param {number} minAmount - Minimum amount in SOL
 * @returns {Promise<boolean>} True if payment is valid
 */
export async function verifyPayment(signature, expectedRecipient, minAmount) {
  try {
    // Get transaction with versioned transaction support
    let transaction = null;
    try {
      transaction = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0, // Support versioned transactions (v0)
      });
    } catch (rpcError) {
      const errorMsg = rpcError?.message || String(rpcError);
      if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
        throw rpcError; // Re-throw for retry logic
      }
      console.error('[Solana] RPC error fetching transaction:', rpcError?.message);
      return false;
    }
    
    if (!transaction) {
      console.error('[Solana] Transaction not found');
      return false;
    }

    if (!transaction.meta || transaction.meta.err !== null) {
      console.error('[Solana] Transaction failed or invalid');
      return false;
    }

    const recipientPubkey = new PublicKey(expectedRecipient);
    const minAmountLamports = Math.floor(minAmount * 1e9); // Convert SOL to lamports

    // Extract account keys (handle both legacy and versioned transactions)
    let accountKeys;
    if (transaction.transaction && transaction.transaction.message) {
      if ('accountKeys' in transaction.transaction.message) {
        accountKeys = transaction.transaction.message.accountKeys;
      } else if ('staticAccountKeys' in transaction.transaction.message) {
        accountKeys = transaction.transaction.message.staticAccountKeys;
      }
    }
    
    if (!accountKeys || accountKeys.length === 0) {
      console.error('[Solana] Could not extract account keys');
      return false;
    }

    // Find recipient in transaction accounts
    const preBalances = transaction.meta.preBalances || [];
    const postBalances = transaction.meta.postBalances || [];
    
    const recipientIndex = accountKeys.findIndex(
      (key) => key.toString() === recipientPubkey.toString()
    );

    if (recipientIndex === -1) {
      console.error('[Solana] Recipient not found in transaction');
      return false;
    }

    // Check if recipient received expected amount
    const amountReceived = postBalances[recipientIndex] - preBalances[recipientIndex];

    if (amountReceived < minAmountLamports) {
      console.error('[Solana] Insufficient payment');
      return false;
    }

    return true;
  } catch (error) {
    const errorMsg = error?.message || String(error);
    
    // Re-throw rate limit errors for retry logic
    if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
      throw error;
    }
    
    console.error('[Solana] Error verifying payment:', error);
    return false;
  }
}
```

### Backend API Endpoint Example

```javascript
import express from 'express';
import { verifyPayment } from '../config/solana.js';

const router = express.Router();

router.post('/api/groups/create', async (req, res) => {
  try {
    const { createPaymentSignature, createPrice, ownerAddress } = req.body;
    const PLATFORM_PAYMENT_ADDRESS = process.env.PLATFORM_PAYMENT_ADDRESS;

    // Verify payment with retry logic
    const maxRetries = 5;
    const baseDelay = 3000;
    let paymentValid = false;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        paymentValid = await verifyPayment(
          createPaymentSignature,
          PLATFORM_PAYMENT_ADDRESS,
          parseFloat(createPrice)
        );
        
        if (paymentValid) {
          break;
        }
      } catch (error) {
        // Handle rate limit errors
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
          const rateLimitDelay = baseDelay * Math.pow(2, attempt) * 2;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
            continue;
          }
        }
        console.error(`Payment verification error on attempt ${attempt}:`, error);
      }
      
      if (!paymentValid && attempt < maxRetries) {
        const retryDelay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    if (!paymentValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Please try again.',
      });
    }

    // Payment verified - create group
    // ... your group creation logic ...

    res.json({ success: true, group: newGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
```

---

## Error Handling

### Common Errors and Solutions

#### 1. "Requires Android Dev Client"

**Error:** `Requires Android Dev Client or standalone build — not Expo Go.`

**Solution:**
```bash
# Build Android Dev Client
npx expo run:android
```

#### 2. "No accounts returned from wallet authorization"

**Error:** Wallet didn't return any accounts

**Solutions:**
- Ensure Phantom (or compatible wallet) is installed
- Check wallet is unlocked
- Try disconnecting and reconnecting

#### 3. "Transaction format error" or "-32602"

**Error:** Invalid transaction payload

**Solutions:**
- Ensure transaction is serialized correctly
- Check base64 encoding is correct
- Verify recent blockhash is valid

#### 4. "Rate limit" or "429 Too Many Requests"

**Error:** RPC endpoint rate limited

**Solutions:**
- Use a paid RPC provider (Helius, QuickNode, Alchemy)
- Implement retry logic with exponential backoff
- Add delays between requests

#### 5. "Transaction not found"

**Error:** Transaction signature not found on blockchain

**Solutions:**
- Wait a few seconds and retry (transaction may not be indexed yet)
- Verify cluster matches (devnet vs mainnet)
- Check RPC endpoint is correct

#### 6. "Insufficient USDC balance"

**Error:** User doesn't have enough USDC

**Solutions:**
- Check user's USDC balance before payment
- Show helpful error message
- Provide instructions on how to get USDC

#### 7. "CancellationException"

**Error:** User cancelled transaction or closed wallet

**Solutions:**
- Handle gracefully (don't treat as error if transaction succeeded)
- Check for signature even if error occurred
- Verify transaction on-chain before showing error

### Error Handling Pattern

```typescript
try {
  const signature = await paymentService.payToCreateGroup(recipient, amount);
  // Success
} catch (error: any) {
  const errorMsg = error?.message || String(error);
  const lc = errorMsg.toLowerCase();
  
  if (lc.includes('cancel')) {
    // User cancelled - show friendly message
    Alert.alert('Payment Cancelled', 'You cancelled the payment.');
  } else if (lc.includes('insufficient')) {
    // Insufficient balance - show specific message
    Alert.alert('Insufficient Balance', errorMsg);
  } else if (lc.includes('requires android') || lc.includes('dev client')) {
    // Wrong environment
    Alert.alert('Dev Client Required', 'Please build with: npx expo run:android');
  } else {
    // Generic error
    Alert.alert('Payment Failed', errorMsg);
  }
}
```

---

## Code Examples

### Complete Integration Example

```typescript
// src/app/payment-screen.tsx
import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { PaymentService } from '../services/payment.service';
import { walletService } from '../services/wallet.service';

export default function PaymentScreen() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      setIsProcessing(true);
      const account = await walletService.verifyOnce();
      setWalletAddress(account.address);
      Alert.alert('Success', `Connected: ${account.address.substring(0, 8)}...`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay with SOL
  const handlePaySOL = async () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please connect wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      const paymentService = new PaymentService();
      const signature = await paymentService.payToCreateGroup(
        'PLATFORM_ADDRESS',
        0.1, // 0.1 SOL
        walletAddress
      );
      Alert.alert('Success', `Payment successful!\n${signature.substring(0, 16)}...`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay with USDC
  const handlePayUSDC = async () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please connect wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      const paymentService = new PaymentService();
      const signature = await paymentService.payToCreateGroupUSDC(
        'PLATFORM_ADDRESS',
        6.9, // 6.9 USDC
        walletAddress
      );
      Alert.alert('Success', `USDC payment successful!\n${signature.substring(0, 16)}...`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Wallet: {walletAddress || 'Not connected'}</Text>
      
      <Button
        title="Connect Wallet"
        onPress={handleConnectWallet}
        disabled={isProcessing}
      />
      
      <Button
        title="Pay 0.1 SOL"
        onPress={handlePaySOL}
        disabled={isProcessing || !walletAddress}
      />
      
      <Button
        title="Pay 6.9 USDC"
        onPress={handlePayUSDC}
        disabled={isProcessing || !walletAddress}
      />
    </View>
  );
}
```

---

## Best Practices

### 1. Always Verify Payments on Backend

**Never trust frontend-only verification.** Always verify transactions on your backend before granting access or creating resources.

```javascript
// ✅ Good: Verify on backend
const isValid = await verifyPayment(signature, recipient, amount);
if (!isValid) {
  return res.status(400).json({ error: 'Invalid payment' });
}

// ❌ Bad: Trusting frontend
// Don't just accept the signature without verification
```

### 2. Use Retry Logic for RPC Calls

RPC endpoints can be rate-limited or temporarily unavailable. Implement retry logic:

```typescript
async function verifyWithRetry(signature: string, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await verifyPayment(signature, recipient, amount);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### 3. Handle Signature Format Conversion

Mobile Wallet Adapter returns base64 signatures, but Solana uses base58. Always convert:

```typescript
function base64ToBase58(base64Sig: string): string {
  try {
    const bytes = Buffer.from(base64Sig, 'base64');
    return bs58.encode(bytes);
  } catch {
    return base64Sig; // Fallback
  }
}
```

### 4. Check Balance Before Payment

For USDC payments, always check balance first:

```typescript
const balance = await connection.getTokenAccountBalance(payerTokenAccount);
if (balance.value.amount < requiredAmount) {
  throw new Error('Insufficient balance');
}
```

### 5. Use Production RPC Providers

Public RPC endpoints have strict rate limits. Use paid providers for production:

- Helius (recommended)
- QuickNode
- Alchemy

### 6. Handle Cancellation Gracefully

Users may cancel transactions. Check if transaction succeeded even if error occurred:

```typescript
let capturedSignature: string | null = null;

try {
  const signature = await wallet.signAndSendTransactions({ payloads: [tx] });
  capturedSignature = signature;
} catch (error) {
  // Check if signature was still returned
  if (capturedSignature) {
    // Transaction may have succeeded
    await connection.confirmTransaction(capturedSignature);
    return capturedSignature;
  }
  throw error;
}
```

### 7. Validate Addresses

Always validate Solana addresses before using:

```typescript
function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
```

### 8. Use Environment Variables

Never hardcode cluster or RPC URLs:

```typescript
// ✅ Good
const CLUSTER = process.env.EXPO_PUBLIC_SOLANA_CLUSTER || 'mainnet-beta';

// ❌ Bad
const CLUSTER = 'mainnet-beta'; // Hardcoded
```

---

## Troubleshooting

### Issue: "Buffer is not defined"

**Solution:** Ensure polyfills are imported first:

```typescript
// Must be first import
import '../polyfills';
```

### Issue: Transactions fail silently

**Solution:** Add comprehensive logging:

```typescript
console.log('[Payment] Transaction details:', {
  amount,
  recipient: recipient.substring(0, 8) + '...',
  payer: payer.substring(0, 8) + '...',
});
```

### Issue: "Invalid payload" errors

**Solution:** Ensure transaction is properly serialized:

```typescript
const serializedTx = tx.serialize({
  requireAllSignatures: false,
  verifySignatures: false,
});
const base64Tx = Buffer.from(serializedTx).toString('base64');
```

### Issue: Rate limit errors

**Solution:** 
1. Use a paid RPC provider
2. Implement exponential backoff
3. Add delays between requests

### Issue: Wallet doesn't open

**Solution:**
- Ensure Phantom (or compatible wallet) is installed
- Check app has proper permissions
- Verify Android Dev Client is built correctly

### Issue: Wrong cluster errors

**Solution:** Ensure frontend and backend use the same cluster:

```typescript
// Frontend
EXPO_PUBLIC_SOLANA_CLUSTER=mainnet-beta

// Backend
SOLANA_CLUSTER=mainnet-beta
```

---

## Quick Reference

### Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `walletService.verifyOnce()` | Connect wallet | `{ address: string }` |
| `paymentService.payToCreateGroup()` | Pay with SOL | `signature: string` |
| `paymentService.payToCreateGroupUSDC()` | Pay with USDC | `signature: string` |
| `verifyPayment()` | Verify payment (backend) | `boolean` |

### Key Addresses

| Network | USDC Mint Address |
|---------|-------------------|
| Mainnet | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Devnet | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

### Conversion Rates

- **1 SOL = 1,000,000,000 lamports**
- **1 USDC = 1,000,000 smallest units** (6 decimals)

---

## Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Mobile Wallet Adapter Docs](https://docs.solanamobile.com/)
- [SPL Token Program](https://spl.solana.com/token)
- [Helius RPC](https://www.helius.dev/)
- [QuickNode RPC](https://www.quicknode.com/)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages carefully
3. Verify environment variables are set correctly
4. Check RPC endpoint status
5. Ensure wallet is properly installed and unlocked

---

**Last Updated:** 2024
**Version:** 1.0.0

