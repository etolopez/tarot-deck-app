/**
 * Credits state store
 * Manages credit balance and syncs with CreditsService
 */

import { create } from "zustand";
import { getBalance } from "../services/creditsService";
import { logger } from "../core/logger";

interface CreditsStore {
  balance: number;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

/**
 * Credits store
 * Syncs balance from AsyncStorage
 */
export const useCreditsStore = create<CreditsStore>((set) => ({
  balance: 0,
  isLoading: false,
  
  refreshBalance: async () => {
    set({ isLoading: true });
    try {
      const balance = await getBalance();
      set({ balance, isLoading: false });
      logger.info("credits.store.refreshed", { balance });
    } catch (error) {
      logger.error("credits.store.refresh.error", {
        error: error instanceof Error ? error.message : String(error),
      });
      set({ isLoading: false });
    }
  },
}));

