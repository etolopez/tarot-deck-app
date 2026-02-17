/**
 * Credit system types
 * Handles purchase sources, ledger entries, and balance tracking
 */

/**
 * Source of credit acquisition
 * - iap: Google Play In-App Purchase
 * - solana: Solana wallet payment
 * - promo: Promotional credits or consumption
 */
export type CreditSource = "iap" | "solana" | "promo";

/**
 * Single entry in the credit ledger
 * Append-only log of all credit transactions
 */
export interface CreditLedgerEntry {
  /** Unique identifier for this ledger entry */
  id: string;
  /** ISO timestamp when entry was created */
  createdAtIso: string;
  /** Source of the credit transaction */
  source: CreditSource;
  /** Change in credits (+ for purchase, - for consumption) */
  delta: number;
  /** External reference (e.g., purchaseToken, txSignature) */
  reference?: string;
  /** Optional note or description */
  note?: string;
}

/**
 * Error thrown when attempting to consume more credits than available
 */
export class InsufficientCreditsError extends Error {
  constructor(
    public readonly requested: number,
    public readonly available: number,
    public readonly readingId: string
  ) {
    super(
      `Insufficient credits: requested ${requested}, available ${available}`
    );
    this.name = "InsufficientCreditsError";
  }
}

