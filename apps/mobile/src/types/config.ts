/**
 * Application configuration types
 * Feature flags and environment settings
 */

/**
 * Feature flags for enabling/disabling functionality
 * Used to control platform-specific features
 */
export interface FeatureFlags {
  /** Enable Solana payments on Android */
  enableSolanaPaymentsAndroid: boolean;
  /** Enable Solana payments on iOS (default: false due to policy) */
  enableSolanaPaymentsIos: boolean;
}

/**
 * Environment configuration loaded at runtime
 */
export interface AppConfig {
  /** Base URL for backend API */
  apiBaseUrl: string;
  /** Solana recipient address for payments */
  solanaRecipientAddress: string;
  /** Feature flags */
  featureFlags: FeatureFlags;
}

