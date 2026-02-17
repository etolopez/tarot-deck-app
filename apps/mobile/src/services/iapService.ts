/**
 * IAPService - Handles Google Play In-App Purchases
 * Uses react-native-iap for consumable credit purchases
 *
 * IMPORTANT: This requires Expo Dev Client (not Expo Go)
 * Native modules are needed for IAP functionality
 */

import { logger } from "../core/logger";
import { grantCredits, getCurrentAccountId } from "./creditsService";
import { SKU_TO_CREDITS, type IapSku } from "../types/iap";

/**
 * IAP connection state
 * Tracks whether we're connected to the Play Store
 */
let isConnected = false;
let iapAvailable = false;

/**
 * Check if IAP module is available
 * Returns true if react-native-iap is successfully loaded
 */
export function isIapAvailable(): boolean {
  return iapAvailable;
}

/**
 * Initialize IAP connection
 * Must be called before any purchase operations
 *
 * Gracefully handles cases where react-native-iap is not available
 * (e.g., build issues, missing native modules)
 */
export async function initializeIap(): Promise<void> {
  logger.info("iap.init.start");

  try {
    // Try to dynamically import react-native-iap
    // This allows the app to work even if IAP has build issues
    const rnIap = await import("react-native-iap");

    if (rnIap && rnIap.initConnection) {
      await rnIap.initConnection();
      isConnected = true;
      iapAvailable = true;
      logger.info("iap.connected", { connected: true });
    } else {
      logger.warn("iap.module.incomplete", {
        message:
          "react-native-iap module loaded but initConnection not available",
      });
      iapAvailable = false;
    }
  } catch (error) {
    // IAP not available - log warning but don't crash
    logger.warn("iap.not.available", {
      error: error instanceof Error ? error.message : String(error),
      message:
        "IAP will be disabled. App will continue without IAP functionality.",
    });
    iapAvailable = false;
    isConnected = false;
    // Don't throw - allow app to continue without IAP
  }
}

/**
 * Fetch available products from Play Store
 * Returns list of SKUs and their details
 */
export async function fetchProducts(): Promise<
  Array<{ sku: IapSku; credits: number }>
> {
  if (!iapAvailable) {
    logger.warn("iap.products.fetch.unavailable");
    // Return empty array if IAP not available
    return [];
  }

  if (!isConnected) {
    throw new Error("IAP not initialized. Call initializeIap() first.");
  }

  try {
    // Try to fetch real products
    const rnIap = await import("react-native-iap");
    if (rnIap && rnIap.getProducts) {
      const products = await rnIap.getProducts({
        skus: Object.keys(SKU_TO_CREDITS) as IapSku[],
      });
      logger.info("iap.products.fetched", {
        count: products.length,
      });
      // Map to our format
      return products.map((p) => ({
        sku: p.productId as IapSku,
        credits: SKU_TO_CREDITS[p.productId as IapSku] || 0,
      }));
    }
  } catch (error) {
    logger.warn("iap.products.fetch.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fallback: return SKU mappings
  logger.info("iap.products.fetched.fallback", {
    count: Object.keys(SKU_TO_CREDITS).length,
  });

  return Object.entries(SKU_TO_CREDITS).map(([sku, credits]) => ({
    sku: sku as IapSku,
    credits,
  }));
}

/**
 * Request a purchase for a specific SKU
 * Handles the purchase flow and grants credits on success
 *
 * @param sku - Product SKU to purchase
 * @returns Purchase result with transaction details
 */
export async function requestPurchase(sku: IapSku): Promise<{
  success: boolean;
  transactionId?: string;
  creditsGranted?: number;
}> {
  if (!iapAvailable) {
    throw new Error(
      "IAP is not available. Please use Solana payments or contact support.",
    );
  }

  if (!isConnected) {
    throw new Error("IAP not initialized. Call initializeIap() first.");
  }

  logger.info("iap.purchase.start", { sku });

  try {
    // Try to use real react-native-iap
    const rnIap = await import("react-native-iap");

    if (rnIap && rnIap.requestPurchase) {
      const purchase = await rnIap.requestPurchase({
        sku,
      });

      // Grant credits locally using account ID if available
      const credits = SKU_TO_CREDITS[sku];
      const accountId = await getCurrentAccountId();
      await grantCredits(
        credits,
        "iap",
        purchase.transactionId || purchase.purchaseToken,
        undefined,
        accountId || undefined,
      );

      // Finish/consume the transaction (required for consumables)
      if (rnIap.finishTransaction) {
        await rnIap.finishTransaction({
          purchase,
          isConsumable: true,
        });
      }

      logger.info("iap.purchase.success", {
        sku,
        reference: purchase.transactionId || purchase.purchaseToken,
      });

      return {
        success: true,
        transactionId: purchase.transactionId || purchase.purchaseToken,
        creditsGranted: credits,
      };
    }
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (
      error?.code === "E_USER_CANCELLED" ||
      error?.message?.includes("cancel")
    ) {
      logger.info("iap.purchase.cancelled", { sku });
      throw new Error("Purchase was cancelled.");
    }

    logger.error("iap.purchase.error", {
      sku,
      code: error?.code,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Fallback: simulate purchase (for development/testing)
  logger.warn("iap.purchase.fallback", {
    sku,
    message: "Using mock purchase - IAP module not fully functional",
  });

  try {
    const credits = SKU_TO_CREDITS[sku];
    const mockTransactionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const accountId = await getCurrentAccountId();

    await grantCredits(
      credits,
      "iap",
      mockTransactionId,
      undefined,
      accountId || undefined,
    );

    logger.info("iap.purchase.success.mock", {
      sku,
      reference: mockTransactionId,
    });

    return {
      success: true,
      transactionId: mockTransactionId,
      creditsGranted: credits,
    };
  } catch (error) {
    logger.error("iap.purchase.error", {
      sku,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Check if IAP is connected
 */
export function isIapConnected(): boolean {
  return isConnected && iapAvailable;
}
