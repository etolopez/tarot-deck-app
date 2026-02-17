/**
 * Solana cluster configuration
 * Set via EXPO_PUBLIC_SOLANA_CLUSTER environment variable
 * Options: 'devnet' | 'mainnet-beta'
 * Default: 'devnet' for development
 */

import { Connection, PublicKey } from "@solana/web3.js";
import Constants from "expo-constants";

/**
 * Solana cluster configuration
 * Set via EXPO_PUBLIC_SOLANA_CLUSTER environment variable or app.json extra
 * Options: 'devnet' | 'mainnet-beta'
 * Default: 'devnet'
 */
const extra = Constants.expoConfig?.extra || {};
export const CLUSTER: "devnet" | "mainnet-beta" = (extra.solanaCluster ||
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER ||
  "devnet") as "devnet" | "mainnet-beta";

/**
 * Solana RPC endpoint
 * Set via EXPO_PUBLIC_SOLANA_RPC environment variable or app.json extra
 * Defaults to public RPC based on cluster
 */
export const SOLANA_RPC =
  extra.solanaRpc ||
  process.env.EXPO_PUBLIC_SOLANA_RPC ||
  (CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com");

/**
 * Get Solana connection instance
 * Uses configured RPC endpoint and cluster
 */
export function getConnection(): Connection {
  return new Connection(SOLANA_RPC, "confirmed");
}

/**
 * Convert wallet address to PublicKey
 * Handles both base58 and base64 encoded addresses from Mobile Wallet Adapter
 *
 * @param address - Wallet address (base58 or base64)
 * @returns PublicKey instance
 */
export function addressToPublicKey(address: string): PublicKey {
  if (!address || typeof address !== "string") {
    throw new Error(`Invalid address: ${address}. Expected a string.`);
  }

  try {
    // Try direct conversion first (base58 - standard Solana address format)
    return new PublicKey(address);
  } catch (e) {
    // If that fails, try converting from base64
    // Mobile Wallet Adapter may return base64 encoded public key bytes
    try {
      const cleanBase64 = address.replace(/[^A-Za-z0-9+/=]/g, "");
      const base64Decoded = Buffer.from(cleanBase64, "base64");

      if (base64Decoded.length !== 32) {
        throw new Error(
          `Invalid address length: ${base64Decoded.length} bytes. Expected 32 bytes.`
        );
      }

      return new PublicKey(base64Decoded);
    } catch (e2) {
      throw new Error(`Invalid address format: ${address.substring(0, 20)}...`);
    }
  }
}
