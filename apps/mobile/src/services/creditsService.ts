/**
 * CreditsService - Manages credit balance and ledger
 * Provides atomic credit consumption and grant operations
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../core/logger";
import type { CreditSource, CreditLedgerEntry } from "../types/credits";
import { InsufficientCreditsError } from "../types/credits";

/**
 * Wallet addresses with infinite credits (dev/testing).
 * When the user connects one of these wallets, they get unlimited credits.
 */
const DEV_WALLET_ADDRESSES: readonly string[] = [
  "2cEktV6uWhSQAzrTiX5ferLXtZShgJcUxJ3HKNRcEarr",
  "DoZ5y7DxFev1JT4p7L1prv6Raj46EZJHBXs4cg1nJ5yb",
];

/**
 * Check if an account has infinite credits (dev wallet)
 */
function hasInfiniteCredits(accountId?: string | null): boolean {
  return accountId != null && DEV_WALLET_ADDRESSES.includes(accountId);
}

/**
 * Storage keys for AsyncStorage
 */
const STORAGE_KEYS = {
  BALANCE: "@tarot:credits:balance",
  LEDGER: "@tarot:credits:ledger",
  WALLET_ADDRESS: "@tarot:wallet:address", // Persist wallet address as account ID
} as const;

/**
 * Get storage key for account-specific balance
 */
function getBalanceKey(accountId?: string): string {
  if (accountId) {
    return `@tarot:credits:balance:${accountId}`;
  }
  return STORAGE_KEYS.BALANCE; // Fallback to global balance
}

/**
 * Get storage key for account-specific ledger
 */
function getLedgerKey(accountId?: string): string {
  if (accountId) {
    return `@tarot:credits:ledger:${accountId}`;
  }
  return STORAGE_KEYS.LEDGER; // Fallback to global ledger
}

/**
 * Get current account ID (wallet address)
 * Returns null if no account is set
 */
export async function getCurrentAccountId(): Promise<string | null> {
  try {
    const address = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    return address;
  } catch (error) {
    logger.error("credits.account.load.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Set current account ID (wallet address)
 * This associates all credits with this wallet address
 */
export async function setCurrentAccountId(accountId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accountId);
    logger.info("credits.account.set", {
      accountId: `${accountId.substring(0, 8)}...`,
    });
  } catch (error) {
    logger.error("credits.account.save.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Clear current account ID
 */
export async function clearCurrentAccountId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    logger.info("credits.account.cleared");
  } catch (error) {
    logger.error("credits.account.clear.error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Simple in-memory mutex to prevent race conditions
 * In production, consider a more robust locking mechanism
 */
let creditLock = false;

/**
 * Acquire lock for credit operations
 * Prevents concurrent modifications
 */
async function acquireLock(): Promise<void> {
  while (creditLock) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  creditLock = true;
}

/**
 * Release lock after credit operation completes
 */
function releaseLock(): void {
  creditLock = false;
}

/**
 * Load current balance from storage
 * Returns 0 if not set
 * Uses account-specific storage if accountId is provided
 */
async function loadBalance(accountId?: string): Promise<number> {
  try {
    const key = accountId
      ? getBalanceKey(accountId)
      : await getCurrentAccountId().then((id) =>
          getBalanceKey(id || undefined),
        );
    const stored = await AsyncStorage.getItem(key);
    if (stored === null) {
      return 0;
    }
    const balance = parseInt(stored, 10);
    if (isNaN(balance)) {
      logger.warn("credits.balance.invalid", { stored });
      return 0;
    }
    return balance;
  } catch (error) {
    logger.error("credits.balance.load.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Save balance to storage
 * Uses account-specific storage if accountId is provided
 */
async function saveBalance(balance: number, accountId?: string): Promise<void> {
  try {
    const key = accountId
      ? getBalanceKey(accountId)
      : await getCurrentAccountId().then((id) =>
          getBalanceKey(id || undefined),
        );
    await AsyncStorage.setItem(key, balance.toString());
  } catch (error) {
    logger.error("credits.balance.save.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Load ledger entries from storage
 * Returns empty array if not set
 * Uses account-specific storage if accountId is provided
 */
async function loadLedger(accountId?: string): Promise<CreditLedgerEntry[]> {
  try {
    const key = accountId
      ? getLedgerKey(accountId)
      : await getCurrentAccountId().then((id) => getLedgerKey(id || undefined));
    const stored = await AsyncStorage.getItem(key);
    if (stored === null) {
      return [];
    }
    return JSON.parse(stored) as CreditLedgerEntry[];
  } catch (error) {
    logger.error("credits.ledger.load.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Append entry to ledger
 * Maintains append-only log
 * Uses account-specific storage if accountId is provided
 */
async function appendLedger(
  entry: CreditLedgerEntry,
  accountId?: string,
): Promise<void> {
  try {
    const ledger = await loadLedger(accountId);
    ledger.push(entry);
    // Keep only last 1000 entries to prevent storage bloat
    const trimmed = ledger.slice(-1000);
    const key = accountId
      ? getLedgerKey(accountId)
      : await getCurrentAccountId().then((id) => getLedgerKey(id || undefined));
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    logger.error("credits.ledger.append.error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get current credit balance
 * Uses account-specific balance if account is set
 * Returns Infinity for dev wallet address
 */
export async function getBalance(accountId?: string): Promise<number> {
  const account = accountId || (await getCurrentAccountId());

  // Dev wallet has infinite credits
  if (hasInfiniteCredits(account)) {
    logger.info("credits.balance.infinite", {
      accountId: account ? `${account.substring(0, 8)}...` : "none",
    });
    return Infinity;
  }

  const balance = await loadBalance(account || undefined);
  logger.info("credits.balance", {
    balance,
    accountId: account ? `${account.substring(0, 8)}...` : "none",
  });
  return balance;
}

/**
 * Grant credits to the user
 * Creates a ledger entry and updates balance atomically
 * Uses account-specific storage if accountId is provided
 */
export async function grantCredits(
  delta: number,
  source: CreditSource,
  reference?: string,
  note?: string,
  accountId?: string,
): Promise<{ newBalance: number }> {
  await acquireLock();
  try {
    // Use provided accountId or get current account
    const account = accountId || (await getCurrentAccountId());

    const balance = await loadBalance(account || undefined);
    const newBalance = balance + delta;

    // Create ledger entry
    const entry: CreditLedgerEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAtIso: new Date().toISOString(),
      source,
      delta,
      reference,
      note,
    };

    await saveBalance(newBalance, account || undefined);
    await appendLedger(entry, account || undefined);

    logger.info("credits.grant", {
      delta,
      source,
      reference,
      newBalance,
      accountId: account ? `${account.substring(0, 8)}...` : "none",
    });

    return { newBalance };
  } finally {
    releaseLock();
  }
}

/**
 * Consume credits for a reading
 * Fails if insufficient credits available
 * Creates a ledger entry for the consumption
 * Uses account-specific storage if accountId is provided
 * Dev wallet never consumes credits (infinite credits)
 */
export async function consumeCredits(
  cost: number,
  readingId: string,
  accountId?: string,
): Promise<{ newBalance: number }> {
  await acquireLock();
  try {
    // Use provided accountId or get current account
    const account = accountId || (await getCurrentAccountId());

    // Dev wallet has infinite credits - skip consumption
    if (hasInfiniteCredits(account)) {
      logger.info("credits.consume.infinite", {
        cost,
        readingId,
        accountId: account ? `${account.substring(0, 8)}...` : "none",
      });
      return { newBalance: Infinity };
    }

    const balance = await loadBalance(account || undefined);

    if (balance < cost) {
      logger.warn("credits.consume.insufficient", {
        cost,
        balance,
        readingId,
      });
      throw new InsufficientCreditsError(cost, balance, readingId);
    }

    const newBalance = balance - cost;

    // Create ledger entry for consumption
    const entry: CreditLedgerEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAtIso: new Date().toISOString(),
      source: "promo", // Consumption is tracked as "promo" source
      delta: -cost,
      note: `consume:${readingId}`,
    };

    await saveBalance(newBalance, account || undefined);
    await appendLedger(entry, account || undefined);

    logger.info("credits.consume.ok", {
      cost,
      newBalance,
      readingId,
      accountId: account ? `${account.substring(0, 8)}...` : "none",
    });

    return { newBalance };
  } finally {
    releaseLock();
  }
}

/**
 * Get recent ledger entries
 * Useful for debugging and transaction history
 * Uses account-specific ledger if accountId is provided
 */
export async function getRecentLedgerEntries(
  limit: number = 10,
  accountId?: string,
): Promise<CreditLedgerEntry[]> {
  const account = accountId || (await getCurrentAccountId());
  const ledger = await loadLedger(account || undefined);
  return ledger.slice(-limit).reverse(); // Most recent first
}

/**
 * Get full ledger (use with caution - can be large)
 * Uses account-specific ledger if accountId is provided
 */
export async function getFullLedger(
  accountId?: string,
): Promise<CreditLedgerEntry[]> {
  const account = accountId || (await getCurrentAccountId());
  return loadLedger(account || undefined);
}
