/**
 * SolanaService - Handles Solana wallet connection and payments
 * Uses Solana Mobile Wallet Adapter (MWA) for Android
 * iOS support is behind a feature flag (default: disabled)
 * 
 * Based on SOLANA_INTEGRATION_GUIDE.md best practices
 * 
 * IMPORTANT: Requires polyfills (react-native-get-random-values)
 * Must be imported before @solana/web3.js
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { logger } from "../core/logger";
import { grantCredits, setCurrentAccountId, getCurrentAccountId } from "./creditsService";
import { getConnection, CLUSTER, addressToPublicKey } from "../config/solana";
import type { WalletAuthResult, SolanaCreditPack } from "../types/solana";
import type { AppConfig } from "../types/config";
import bs58 from "bs58";

// Persistent storage keys
const WALLET_STORAGE_KEY = "@tarot:wallet:address";
const WALLET_AUTH_TOKEN_KEY = "@tarot:wallet:auth_token";

/**
 * App identity for Mobile Wallet Adapter
 * Used when requesting wallet authorization.
 * uri must be absolute https (required by MWA); no external webpage link.
 */
const APP_IDENTITY = {
  name: "Tarot",
  uri: "https://localhost/",
  icon: "favicon.ico",
} as const;

/**
 * Current wallet connection state
 */
let walletState: {
  address: string | null;
  authToken: string | null;
} = {
  address: null,
  authToken: null,
};

/**
 * App configuration (injected at runtime)
 */
let config: AppConfig | null = null;

/**
 * Initialize Solana service with app configuration
 * Also restores persisted wallet connection if available
 */
export async function initializeSolanaService(appConfig: AppConfig): Promise<void> {
  config = appConfig;
  
  // Restore wallet connection from storage
  await restoreWalletConnection();
  
  logger.info("solana.service.init", {
    cluster: CLUSTER,
    rpcUrl: getConnection().rpcEndpoint.substring(0, 50) + "...",
    recipientAddress: appConfig.solanaRecipientAddress
      ? `${appConfig.solanaRecipientAddress.substring(0, 8)}...`
      : "not set",
    androidEnabled: appConfig.featureFlags.enableSolanaPaymentsAndroid,
    iosEnabled: appConfig.featureFlags.enableSolanaPaymentsIos,
    walletRestored: walletState.address !== null,
  });
}

/**
 * Restore wallet connection from persistent storage
 * Called on app startup to reconnect to previously connected wallet
 */
async function restoreWalletConnection(): Promise<void> {
  try {
    const savedAddress = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
    if (savedAddress) {
      // Restore wallet address
      walletState.address = savedAddress;
      
      // Try to restore auth token (if available)
      try {
        const savedAuthToken = await SecureStore.getItemAsync(WALLET_AUTH_TOKEN_KEY);
        if (savedAuthToken) {
          walletState.authToken = savedAuthToken;
        }
      } catch (error) {
        // Auth token restoration is optional
        logger.warn("solana.wallet.auth.restore.failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      
      // Set as current account ID for credits
      await setCurrentAccountId(savedAddress);
      
      logger.info("solana.wallet.restored", {
        address: `${savedAddress.substring(0, 8)}...`,
      });
    }
  } catch (error) {
    logger.error("solana.wallet.restore.error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Assert that we're running on Android Dev Client
 * Throws error if not on Android or if using Expo Go
 */
function assertDevClientAndroid(): void {
  const ownership = (Constants as any)?.appOwnership as string | undefined;
  if (Platform.OS !== "android") {
    throw new Error(
      "Solana wallet requires Android (Mobile Wallet Adapter)."
    );
  }
  if (ownership === "expo") {
    throw new Error(
      "Requires Android Dev Client or standalone build — not Expo Go."
    );
  }
}

/**
 * Check if Solana payments are enabled for current platform
 */
export function isSolanaEnabled(): boolean {
  if (!config) {
    return false;
  }

  if (Platform.OS === "android") {
    return config.featureFlags.enableSolanaPaymentsAndroid;
  }
  if (Platform.OS === "ios") {
    return config.featureFlags.enableSolanaPaymentsIos;
  }

  return false;
}

/**
 * Convert base64 signature to base58 (Solana format)
 * Mobile Wallet Adapter returns signatures as base64
 * 
 * @param base64Sig - Base64 encoded signature
 * @returns Base58 encoded signature
 */
function base64ToBase58(base64Sig: string): string {
  try {
    // Check if already base58 (no base64 characters)
    const base64Chars = /[+/=]/;
    if (!base64Chars.test(base64Sig)) {
      return base64Sig; // Already base58
    }

    // Convert base64 to bytes, then to base58
    const bytes = Buffer.from(base64Sig, "base64");
    return bs58.encode(bytes);
  } catch (error) {
    logger.error("solana.signature.convert.failed", {
      error: error instanceof Error ? error.message : String(error),
      signature: base64Sig.substring(0, 20) + "...",
    });
    throw new Error(`Failed to convert signature to base58: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert Uint8Array or Buffer to base64 string
 * 
 * @param data - Data to convert
 * @returns Base64 encoded string
 */
function toBase64(data: Uint8Array | Buffer): string {
  if (Buffer.isBuffer(data)) {
    return data.toString("base64");
  }
  return Buffer.from(data).toString("base64");
}

/**
 * Connect to Solana wallet using Mobile Wallet Adapter
 * Returns authorization result with public key in base58 format
 * 
 * Based on SOLANA_INTEGRATION_GUIDE.md wallet connection pattern
 */
export async function connectWallet(): Promise<WalletAuthResult> {
  if (!config) {
    throw new Error("Solana service not initialized");
  }

  if (!isSolanaEnabled()) {
    throw new Error("Solana payments not enabled for this platform");
  }

  assertDevClientAndroid();

  logger.info("solana.wallet.connect.start");

  try {
    // Lazy import to avoid issues in Expo Go
    const { transact } = await import(
      "@solana-mobile/mobile-wallet-adapter-protocol"
    );

    // Do not pass baseUri so the wallet prompts natively (Phantom app) instead of opening a webpage
    const walletAssociationConfig = undefined;

    const res = await transact(
      async (wallet: any) => {
      // Authorize with cluster - opens native wallet picker (e.g. Phantom app)
      const { accounts } = await wallet.authorize({
        cluster: CLUSTER,
        identity: APP_IDENTITY as any,
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet authorization");
      }

      const account = accounts[0];
      let address =
        typeof account === "string"
          ? account
          : account?.address || account?.publicKey || account;

      if (!address || typeof address !== "string") {
        throw new Error("Invalid account format returned from wallet");
      }

      // Convert to base58 format (standard Solana address format)
      const publicKey = addressToPublicKey(address);
      address = publicKey.toBase58();

      // Get auth token if available
      const authToken = (wallet as any).auth_token || null;

      return { address, authToken };
    },
      walletAssociationConfig,
    );

    if (!res || !res.address) {
      throw new Error("Invalid response from wallet verification");
    }

    // Store wallet state
    walletState = {
      address: res.address,
      authToken: res.authToken || null,
    };

    // Persist wallet address and auth token
    await AsyncStorage.setItem(WALLET_STORAGE_KEY, res.address);
    if (res.authToken) {
      try {
        await SecureStore.setItemAsync(WALLET_AUTH_TOKEN_KEY, res.authToken);
      } catch (error) {
        logger.warn("solana.wallet.auth.save.failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Set wallet address as account ID for credits
    await setCurrentAccountId(res.address);

    logger.info("solana.wallet.connect.success", {
      address: `${res.address.substring(0, 8)}...`,
    });

    return res as WalletAuthResult;
  } catch (e: any) {
    const errorMsg = e?.message || e?.toString() || "Unknown error";
    const lc = String(errorMsg).toLowerCase();

    // Handle cancellation errors gracefully
    if (lc.includes("cancel") || lc.includes("reject")) {
      const cancelError = new Error(
        "Wallet connection was cancelled. Please try again."
      );
      logger.warn("solana.wallet.connect.cancelled");
      throw cancelError;
    }

    if (lc.includes("timeout")) {
      const timeoutError = new Error(
        "Connection timed out. Please try again."
      );
      logger.error("solana.wallet.connect.timeout");
      throw timeoutError;
    }

    logger.error("solana.wallet.connect.error", {
      message: errorMsg,
    });
    throw new Error(`Wallet verification failed: ${errorMsg}`);
  }
}

/**
 * Send SOL payment to recipient address
 * Builds transfer transaction, signs with wallet, and confirms
 * 
 * Based on SOLANA_INTEGRATION_GUIDE.md payment processing pattern
 */
export async function sendSolPayment(
  creditPack: SolanaCreditPack
): Promise<{ txSignature: string; creditsGranted: number }> {
  if (!config) {
    throw new Error("Solana service not initialized");
  }

  if (!config.solanaRecipientAddress) {
    throw new Error("Solana recipient address not configured");
  }

  assertDevClientAndroid();

  logger.info("solana.pay.start", {
    lamports: creditPack.lamports,
    solAmount: creditPack.lamports / LAMPORTS_PER_SOL,
    to: `${config.solanaRecipientAddress.substring(0, 8)}...`,
    credits: creditPack.credits,
  });

  try {
    const { transact } = await import(
      "@solana-mobile/mobile-wallet-adapter-protocol"
    );
    const connection = getConnection();

    const walletAssociationConfig = undefined;

    const res = await transact(
      async (wallet: any) => {
      // 1. Check if we have a persisted wallet address
      // If so, try to use reauthorize() if available, otherwise authorize()
      let accounts;
      
      if (walletState.address && walletState.authToken && wallet.reauthorize) {
        // Try to reauthorize with existing auth token
        try {
          const reauthResult = await wallet.reauthorize({
            auth_token: walletState.authToken,
            identity: APP_IDENTITY as any,
          });
          accounts = reauthResult.accounts || [walletState.address];
        } catch (error) {
          // If reauthorize fails, fall back to authorize
          logger.warn("solana.wallet.reauthorize.failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          const authResult = await wallet.authorize({
            cluster: CLUSTER,
            identity: APP_IDENTITY as any,
          });
          accounts = authResult.accounts;
        }
      } else {
        // No persisted connection, authorize fresh
        const authResult = await wallet.authorize({
          cluster: CLUSTER,
          identity: APP_IDENTITY as any,
        });
        accounts = authResult.accounts;
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet authorization");
      }

      const account = accounts[0];
      let payerAddress =
        typeof account === "string"
          ? account
          : account?.address || account?.publicKey || account;

      if (!payerAddress || typeof payerAddress !== "string") {
        throw new Error("Invalid account format returned from wallet");
      }

      // Convert to base58
      const publicKey = addressToPublicKey(payerAddress);
      payerAddress = publicKey.toBase58();

      // Update wallet state and persist
      walletState.address = payerAddress;
      
      // Get and persist new auth token if available
      const newAuthToken = (wallet as any).auth_token || walletState.authToken;
      if (newAuthToken && newAuthToken !== walletState.authToken) {
        walletState.authToken = newAuthToken;
        try {
          await SecureStore.setItemAsync(WALLET_AUTH_TOKEN_KEY, newAuthToken);
        } catch (error) {
          logger.warn("solana.wallet.auth.save.failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      // Persist wallet address
      await AsyncStorage.setItem(WALLET_STORAGE_KEY, payerAddress);

      const payer = new PublicKey(payerAddress);
      const recipient = new PublicKey(config.solanaRecipientAddress);

      // 2. Build transfer instruction
      const transferIx = SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: recipient,
        lamports: creditPack.lamports,
      });

      // 3. Build transaction
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      const tx = new Transaction({
        feePayer: payer,
        recentBlockhash: blockhash,
      }).add(transferIx);

      // 4. Serialize to base64 (required by Mobile Wallet Adapter)
      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = toBase64(serializedTx);

      // 5. Sign and send transaction
      const signedTxs = await wallet.signAndSendTransactions({
        payloads: [base64Tx],
      });

      // 6. Extract signature
      let signature: string | null = null;
      if (
        signedTxs &&
        typeof signedTxs === "object" &&
        "signatures" in signedTxs
      ) {
        const sigs = (signedTxs as any).signatures;
        if (Array.isArray(sigs) && sigs.length > 0) {
          signature = sigs[0];
        }
      } else if (Array.isArray(signedTxs) && signedTxs.length > 0) {
        signature =
          typeof signedTxs[0] === "string"
            ? signedTxs[0]
            : signedTxs[0].signature || "";
      } else if (typeof signedTxs === "string") {
        signature = signedTxs;
      }

      if (!signature) {
        throw new Error("No transaction signature returned from wallet");
      }

      // 7. Convert base64 signature to base58
      signature = base64ToBase58(signature);

      // 8. Confirm transaction
      const confirmationResult = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmationResult.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`
        );
      }

      logger.info("solana.pay.sent", {
        txSignature: `${signature.substring(0, 16)}...`,
      });
      logger.info("solana.pay.confirmed", {
        txSignature: `${signature.substring(0, 16)}...`,
      });

      return signature;
    },
      walletAssociationConfig,
    );

    const txSignature = res as string;

    // Grant credits locally using wallet address as account ID
    const accountId = walletState.address;
    if (!accountId) {
      throw new Error("Wallet not connected. Cannot grant credits.");
    }
    await grantCredits(creditPack.credits, "solana", txSignature, undefined, accountId);

    // Optionally verify with backend
    if (config.apiBaseUrl && walletState.address) {
      try {
        const verifyResponse = await fetch(
          `${config.apiBaseUrl}/v1/solana/verify-and-grant`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: walletState.address,
              txSignature,
              expectedRecipient: config.solanaRecipientAddress,
              expectedLamportsMin: creditPack.lamports,
              creditDelta: creditPack.credits,
            }),
          }
        );

        if (!verifyResponse.ok) {
          logger.warn("solana.verify.backend.failed", {
            status: verifyResponse.status,
          });
        } else {
          logger.info("solana.verify.backend.success");
        }
      } catch (error) {
        logger.warn("solana.verify.backend.error", {
          error:
            error instanceof Error ? error.message : String(error),
        });
        // Don't throw - local credits already granted
      }
    }

    return {
      txSignature,
      creditsGranted: creditPack.credits,
    };
  } catch (e: any) {
    const errorMsg = e?.message || e?.toString() || "Unknown error";
    const lc = errorMsg.toLowerCase();

    // Handle cancellation gracefully
    if (lc.includes("cancel")) {
      const cancelError = new Error(
        "Payment was cancelled. Please try again."
      );
      logger.warn("solana.pay.cancelled");
      throw cancelError;
    }

    logger.error("solana.pay.error", {
      message: errorMsg,
    });
    throw new Error(`Payment failed: ${errorMsg}`);
  }
}

/**
 * Get current wallet address
 */
export function getWalletAddress(): string | null {
  return walletState.address;
}

/**
 * Disconnect wallet
 * Also clears the account ID from credits service and persistent storage
 */
export async function disconnectWallet(): Promise<void> {
  logger.info("solana.wallet.disconnect");
  walletState = {
    address: null,
    authToken: null,
  };
  
  // Clear persistent storage
  try {
    await AsyncStorage.removeItem(WALLET_STORAGE_KEY);
    await SecureStore.deleteItemAsync(WALLET_AUTH_TOKEN_KEY);
  } catch (error) {
    logger.warn("solana.wallet.storage.clear.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  
  // Clear account ID
  const { clearCurrentAccountId } = await import("./creditsService");
  await clearCurrentAccountId();
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return walletState.address !== null;
}
