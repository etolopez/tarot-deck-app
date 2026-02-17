/**
 * In-App Purchase types
 * Maps SKUs to credit amounts and handles purchase flow
 */

/**
 * Product SKU identifiers for Google Play
 */
export type IapSku = "tarot_credits_5" | "tarot_credits_15";

/**
 * Mapping of SKU to credit amount
 * Single source of truth for credit pricing
 */
export const SKU_TO_CREDITS: Record<IapSku, number> = {
  tarot_credits_5: 5,
  tarot_credits_15: 15,
};

/**
 * IAP purchase state
 */
export type IapState =
  | "IAP_INIT"
  | "IAP_CONNECTED"
  | "IAP_PRODUCTS_READY"
  | "IAP_PURCHASING"
  | "IAP_GRANT_CREDITS"
  | "IAP_ERROR";

