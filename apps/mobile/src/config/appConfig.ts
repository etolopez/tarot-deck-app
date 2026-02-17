/**
 * App configuration loader
 * Reads environment variables and feature flags
 * Provides type-safe configuration throughout the app
 */

import Constants from "expo-constants";
import { logger } from "../core/logger";
import type { AppConfig, FeatureFlags } from "../types/config";

/**
 * Load app configuration from environment
 * Falls back to defaults for development
 */
export function loadAppConfig(): AppConfig {
  const extra = Constants.expoConfig?.extra || {};

  // Feature flags with defaults
  const featureFlags: FeatureFlags = {
    enableSolanaPaymentsAndroid:
      extra.enableSolanaPaymentsAndroid !== undefined
        ? extra.enableSolanaPaymentsAndroid
        : true, // Default enabled for Android
    enableSolanaPaymentsIos:
      extra.enableSolanaPaymentsIos !== undefined
        ? extra.enableSolanaPaymentsIos
        : false, // Default disabled for iOS
  };

  // API base URL (default to localhost for development)
  const apiBaseUrl =
    extra.apiBaseUrl ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "http://localhost:3000";

  // Solana recipient address
  const solanaRecipientAddress =
    extra.solanaRecipientAddress ||
    process.env.EXPO_PUBLIC_SOLANA_RECIPIENT_ADDRESS ||
    "";

  const config: AppConfig = {
    apiBaseUrl,
    solanaRecipientAddress,
    featureFlags,
  };

  logger.info("config.loaded", {
    apiBaseUrl,
    solanaRecipientAddress: solanaRecipientAddress ? "***" : "not set",
    featureFlags,
  });

  return config;
}

/**
 * Singleton config instance
 * Load once, use everywhere
 */
let appConfig: AppConfig | null = null;

/**
 * Get app configuration
 * Loads on first access if not already loaded
 */
export function getAppConfig(): AppConfig {
  if (!appConfig) {
    appConfig = loadAppConfig();
  }
  return appConfig;
}

