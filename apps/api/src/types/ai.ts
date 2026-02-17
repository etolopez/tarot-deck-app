/**
 * AI reading request and response types
 * Matches the contract defined in the mobile app
 */

/**
 * Request body for AI reading generation
 */
export interface AiReadingRequest {
  readingId: string;
  question: string | null;
  spread: {
    id: string;
    positions: Array<{
      index: number;
      label: string;
      prompt: string;
    }>;
  };
  cards: Array<{
    cardId: string;
    name: string;
    positionIndex: number;
    positionLabel: string;
    isReversed: boolean;
    meaning: string;
    description: string;
  }>;
  tone: "heavenly_clean";
  outputFormat: "text";
}

/**
 * Response from AI reading endpoint
 */
export interface AiReadingResponse {
  readingId: string;
  aiNarrative: string;
}

