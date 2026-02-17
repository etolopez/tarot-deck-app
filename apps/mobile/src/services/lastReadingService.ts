/**
 * Last Reading Service - Persist and load the most recent reading per wallet
 * Keyed by account ID (wallet address) so each connected wallet has its own last reading
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../core/logger";
import type { ReadingResultLocal } from "../types/tarot";

const STORAGE_KEY_PREFIX = "@tarot:lastReading:";

/**
 * Storage key for a given account (wallet address)
 */
function getLastReadingKey(accountId: string): string {
  return `${STORAGE_KEY_PREFIX}${accountId}`;
}

/**
 * Save the last reading for the given account.
 * Overwrites any previous last reading for this wallet.
 */
export async function saveLastReading(
  accountId: string,
  reading: ReadingResultLocal
): Promise<void> {
  try {
    const key = getLastReadingKey(accountId);
    const json = JSON.stringify(reading);
    await AsyncStorage.setItem(key, json);
    logger.info("lastReading.save", {
      accountId: `${accountId.substring(0, 8)}...`,
      readingId: reading.readingId,
      spreadId: reading.spreadId,
    });
  } catch (error) {
    logger.error("lastReading.save.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Load the last reading for the given account, or null if none or not found.
 */
export async function getLastReading(
  accountId: string | null
): Promise<ReadingResultLocal | null> {
  if (!accountId) {
    return null;
  }
  try {
    const key = getLastReadingKey(accountId);
    const json = await AsyncStorage.getItem(key);
    if (!json) {
      return null;
    }
    const reading = JSON.parse(json) as ReadingResultLocal;
    logger.info("lastReading.load", {
      accountId: `${accountId.substring(0, 8)}...`,
      readingId: reading.readingId,
    });
    return reading;
  } catch (error) {
    logger.error("lastReading.load.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
