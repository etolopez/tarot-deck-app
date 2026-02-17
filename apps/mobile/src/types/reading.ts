/**
 * Reading session state machine types
 * Tracks the flow from spread selection to result display
 */

/**
 * Reading session state
 */
export type ReadingState =
  | "IDLE"
  | "SPREAD_SELECTED"
  | "CREDIT_CHECK"
  | "PAYWALL"
  | "SHUFFLING"
  | "REVEALING"
  | "AI_OPTION"
  | "AI_REQUESTING"
  | "RESULT";

