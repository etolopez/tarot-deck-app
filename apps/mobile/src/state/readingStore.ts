/**
 * Reading state store using Zustand
 * Manages reading session state machine and UI flow
 */

import { create } from "zustand";
import type { ReadingState, ReadingResultLocal } from "../types/reading";
import type { SpreadId } from "../types/tarot";

interface ReadingStore {
  // State machine state
  readingState: ReadingState;
  
  // Current reading data
  currentReading: ReadingResultLocal | null;
  
  // Spread selection
  selectedSpreadId: SpreadId | null;
  question: string | undefined;
  enableAiNarrative: boolean;
  
  // Actions
  selectSpread: (spreadId: SpreadId) => void;
  setQuestion: (question: string | undefined) => void;
  setEnableAiNarrative: (enable: boolean) => void;
  setReadingState: (state: ReadingState) => void;
  setCurrentReading: (reading: ReadingResultLocal | null) => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  readingState: "IDLE" as ReadingState,
  currentReading: null,
  selectedSpreadId: null,
  question: undefined,
  enableAiNarrative: true,
};

/**
 * Reading store
 * Manages the entire reading flow state
 */
export const useReadingStore = create<ReadingStore>((set) => ({
  ...initialState,
  
  selectSpread: (spreadId) => {
    set({ selectedSpreadId: spreadId, readingState: "SPREAD_SELECTED" });
  },
  
  setQuestion: (question) => {
    set({ question });
  },
  
  setEnableAiNarrative: (enable) => {
    set({ enableAiNarrative: enable });
  },
  
  setReadingState: (state) => {
    set({ readingState: state });
  },
  
  setCurrentReading: (reading) => {
    set({ currentReading: reading });
  },
  
  reset: () => {
    set(initialState);
  },
}));

