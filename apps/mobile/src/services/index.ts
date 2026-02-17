/**
 * Services barrel export
 * Central export point for all service modules
 */

export { initializeAiService, generateAiNarrative } from "./aiService";
export {
  initializeSolanaService,
  connectWallet,
  sendSolPayment,
  isSolanaEnabled,
  isWalletConnected,
  getWalletAddress,
  disconnectWallet,
} from "./solanaService";
export {
  initializeIap,
  fetchProducts,
  requestPurchase,
  isIapConnected,
} from "./iapService";
export {
  getBalance,
  grantCredits,
  consumeCredits,
  getRecentLedgerEntries,
  getFullLedger,
} from "./creditsService";

