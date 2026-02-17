/**
 * Solana configuration for backend
 * Handles RPC connection and transaction verification
 * Based on SOLANA_INTEGRATION_GUIDE.md patterns
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const CLUSTER = process.env.SOLANA_CLUSTER || "devnet";
const RPC_URL =
  process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER as "devnet" | "mainnet-beta");

/**
 * Solana connection instance
 * Uses configured RPC endpoint
 */
export const connection = new Connection(RPC_URL, "confirmed");

// Log RPC configuration (for debugging)
if (process.env.NODE_ENV !== "production" || process.env.LOG_RPC_CONFIG === "true") {
  logger.info("solana.rpc.config", {
    cluster: CLUSTER,
    rpcUrl: RPC_URL?.substring(0, 60) + (RPC_URL?.length > 60 ? "..." : ""),
    hasCustomRpc: !!process.env.SOLANA_RPC_URL,
  });
}

/**
 * Verify a payment transaction
 * Checks that transaction exists, succeeded, and recipient received expected amount
 * 
 * Based on SOLANA_INTEGRATION_GUIDE.md verification pattern
 * 
 * @param signature - Transaction signature (base58 encoded)
 * @param expectedRecipient - Expected recipient address
 * @param minAmount - Minimum amount in lamports
 * @returns Promise<boolean> - True if payment is valid
 */
export async function verifyPayment(
  signature: string,
  expectedRecipient: string,
  minAmount: number
): Promise<boolean> {
  try {
    // Get transaction with versioned transaction support
    let transaction = null;
    try {
      transaction = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0, // Support versioned transactions (v0)
      });
    } catch (rpcError: any) {
      const errorMsg = rpcError?.message || String(rpcError);
      
      // Re-throw rate limit errors for retry logic
      if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests")) {
        throw rpcError;
      }
      
      logger.error("solana.verify.rpc.error", {
        signature: signature.substring(0, 16) + "...",
        error: errorMsg,
      });
      return false;
    }

    if (!transaction) {
      logger.error("solana.verify.transaction.not.found", {
        signature: signature.substring(0, 16) + "...",
      });
      return false;
    }

    if (!transaction.meta || transaction.meta.err !== null) {
      logger.error("solana.verify.transaction.failed", {
        signature: signature.substring(0, 16) + "...",
        error: transaction.meta?.err,
      });
      return false;
    }

    const recipientPubkey = new PublicKey(expectedRecipient);
    const minAmountLamports = Math.floor(minAmount);

    // Extract account keys (handle both legacy and versioned transactions)
    let accountKeys: PublicKey[] = [];
    if (transaction.transaction && transaction.transaction.message) {
      if ("accountKeys" in transaction.transaction.message) {
        accountKeys = transaction.transaction.message.accountKeys;
      } else if ("staticAccountKeys" in transaction.transaction.message) {
        accountKeys = transaction.transaction.message.staticAccountKeys;
      }
    }

    if (!accountKeys || accountKeys.length === 0) {
      logger.error("solana.verify.no.account.keys", {
        signature: signature.substring(0, 16) + "...",
      });
      return false;
    }

    // Find recipient in transaction accounts
    const preBalances = transaction.meta.preBalances || [];
    const postBalances = transaction.meta.postBalances || [];

    const recipientIndex = accountKeys.findIndex(
      (key) => key.toString() === recipientPubkey.toString()
    );

    if (recipientIndex === -1) {
      logger.error("solana.verify.recipient.not.found", {
        signature: signature.substring(0, 16) + "...",
        expectedRecipient: expectedRecipient.substring(0, 8) + "...",
      });
      return false;
    }

    // Check if recipient received expected amount
    const amountReceived = postBalances[recipientIndex] - preBalances[recipientIndex];

    if (amountReceived < minAmountLamports) {
      logger.error("solana.verify.insufficient.payment", {
        signature: signature.substring(0, 16) + "...",
        expected: minAmountLamports,
        received: amountReceived,
      });
      return false;
    }

    logger.info("solana.verify.success", {
      signature: signature.substring(0, 16) + "...",
      amountReceived,
    });

    return true;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // Re-throw rate limit errors for retry logic
    if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests")) {
      throw error;
    }

    logger.error("solana.verify.error", {
      signature: signature.substring(0, 16) + "...",
      error: errorMsg,
    });
    return false;
  }
}

