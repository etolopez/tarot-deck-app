/**
 * AiService - Client for backend AI narrative generation
 * Never calls OpenAI directly from mobile
 * All AI requests go through the backend API
 */

import { logger } from "../core/logger";
import type { ReadingResultLocal } from "../types/tarot";
import type { AppConfig } from "../types/config";

/**
 * App configuration (injected at runtime)
 */
let config: AppConfig | null = null;

/**
 * Initialize AI service with app configuration
 */
export function initializeAiService(appConfig: AppConfig): void {
  config = appConfig;
  logger.info("ai.service.init", {
    apiBaseUrl: appConfig.apiBaseUrl,
  });
}

/**
 * Request body for AI reading generation
 */
interface AiReadingRequest {
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
interface AiReadingResponse {
  readingId: string;
  aiNarrative: string;
}

/**
 * Error response from API
 */
interface ApiError {
  error: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Generate AI narrative for a reading
 * Sends reading data to backend and returns narrative text
 */
export async function generateAiNarrative(
  reading: ReadingResultLocal
): Promise<string> {
  if (!config) {
    throw new Error("AI service not initialized");
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  logger.info("ai.reading.request", {
    requestId,
    readingId: reading.readingId,
    spreadId: reading.spreadId,
    cardCount: reading.drawnCards.length,
  });

  try {
    // Build request payload
    const requestBody: AiReadingRequest = {
      readingId: reading.readingId,
      question: reading.question || null,
      spread: {
        id: reading.spreadId,
        positions: reading.perCardText.map((card, idx) => {
          // Find the position from the original spread
          // For now, we'll use a simplified structure
          return {
            index: idx,
            label: card.title.split(" — ")[1] || `Position ${idx + 1}`,
            prompt: `This card represents ${card.title.split(" — ")[1] || `position ${idx + 1}`}. ${card.meaning}`,
          };
        }),
      },
      cards: reading.perCardText.map((card, idx) => ({
        cardId: reading.drawnCards[idx].cardId,
        name: card.title.split(" — ")[0],
        positionIndex: idx,
        positionLabel: card.title.split(" — ")[1] || `Position ${idx + 1}`,
        isReversed: reading.drawnCards[idx].isReversed,
        meaning: card.meaning,
        description: card.description,
      })),
      tone: "heavenly_clean",
      outputFormat: "text",
    };

    // Make API request
    const response = await fetch(`${config.apiBaseUrl}/v1/ai/reading`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Handle error responses
    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      
      if (response.status === 400) {
        logger.error("ai.reading.error.validation", {
          requestId,
          error: errorData.error,
          details: errorData.details,
        });
        throw new Error(`Validation error: ${errorData.error}`);
      }

      if (response.status === 429) {
        logger.error("ai.reading.error.ratelimit", {
          requestId,
        });
        throw new Error("Rate limited. Please try again later.");
      }

      logger.error("ai.reading.error.server", {
        requestId,
        status: response.status,
        error: errorData.error,
        requestIdFromServer: errorData.requestId,
      });
      throw new Error(`Server error: ${errorData.error || response.statusText}`);
    }

    // Parse successful response
    const data = (await response.json()) as AiReadingResponse;

    logger.info("ai.reading.success", {
      requestId,
      readingId: reading.readingId,
      narrativeLength: data.aiNarrative.length,
    });

    return data.aiNarrative;
  } catch (error) {
    logger.error("ai.reading.error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

