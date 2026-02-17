/**
 * Solana wallet and payment types
 * Handles wallet connection and transaction flow
 */

/**
 * Solana wallet connection state
 */
export type WalletState =
  | "WALLET_DISCONNECTED"
  | "WALLET_AUTHORIZING"
  | "WALLET_CONNECTED"
  | "WALLET_ERROR";

/**
 * Payment transaction state
 */
export type PaymentState =
  | "IDLE"
  | "TX_SIGNING_SENDING"
  | "TX_CONFIRMING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_ERROR";

/**
 * Wallet authorization result from MWA
 */
export interface WalletAuthResult {
  /** Public key of connected wallet */
  address: string;
  /** Authorization token for subsequent requests */
  authToken: string;
}

/**
 * Credit pack configuration for Solana payments
 */
export interface SolanaCreditPack {
  /** Number of credits granted */
  credits: number;
  /** SOL amount in lamports */
  lamports: number;
  /** Display label */
  label: string;
}

