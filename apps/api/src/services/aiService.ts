/**
 * AI Service - Handles OpenAI API calls
 * Uses OpenAI Responses API (recommended for new projects)
 * Generates tarot reading narratives based on cards and spread
 */

import OpenAI from "openai";
import { logger } from "../utils/logger";
import type { AiReadingRequest } from "../types/ai";

/**
 * Initialize OpenAI client
 * API key must be set in environment variable
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build prompt text for OpenAI
 * Combines spread positions, card meanings, and user question
 */
function buildPrompt(request: AiReadingRequest): string {
  const { question, spread, cards } = request;

  // Start with tone and disclaimer
  let prompt = `You are a compassionate and insightful tarot reader. Provide readings in a heavenly, clean, calm, and supportive tone. Always include a disclaimer that readings are for reflection and entertainment purposes only, not medical, legal, or financial advice.\n\n`;

  // Add spread context
  prompt += `Spread: ${spread.id} (${spread.positions.length} cards)\n\n`;

  // Add each card with its position and meaning
  prompt += "Cards drawn:\n";
  for (const card of cards) {
    const position = spread.positions.find((p) => p.index === card.positionIndex);
    prompt += `\n- ${card.name}${card.isReversed ? " (Reversed)" : ""} — ${card.positionLabel}\n`;
    prompt += `  Meaning: ${card.meaning}\n`;
    prompt += `  Description: ${card.description}\n`;
    if (position) {
      prompt += `  Position Context: ${position.prompt}\n`;
    }
  }

  // Add user question if provided
  if (question) {
    prompt += `\n\nUser's Question: ${question}\n`;
  }

  // Add output instructions
  prompt += `\n\nPlease provide a cohesive narrative reading that:\n`;
  prompt += `1. Integrates all cards and their positions into a meaningful story\n`;
  prompt += `2. Addresses the user's question if provided\n`;
  prompt += `3. Maintains a supportive, calm, and heavenly tone\n`;
  prompt += `4. Includes a brief disclaimer about entertainment/reflection purposes\n`;
  prompt += `5. Concludes with 3-5 short bullet points of key takeaways\n`;
  prompt += `\nFormat your response as a single narrative paragraph followed by bullet points.`;

  return prompt;
}

/**
 * Generate tarot reading narrative using OpenAI
 * Uses Responses API (gpt-4o-mini or similar model)
 */
export async function generateTarotNarrative(
  request: AiReadingRequest
): Promise<string> {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  logger.info("ai.reading.request", {
    requestId,
    readingId: request.readingId,
    spreadId: request.spread.id,
    cardCount: request.cards.length,
    hasQuestion: !!request.question,
  });

  try {
    const promptText = buildPrompt(request);

    // Use OpenAI Responses API
    // Note: If Responses API is not available, fall back to Chat Completions
    // For now, we'll use chat completions as Responses API may not be available yet
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a compassionate and insightful tarot reader. Provide readings in a heavenly, clean, calm, and supportive tone. Always include a disclaimer that readings are for reflection and entertainment purposes only, not medical, legal, or financial advice.",
        },
        {
          role: "user",
          content: promptText,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const narrative = response.choices[0]?.message?.content;

    if (!narrative) {
      throw new Error("No narrative generated from OpenAI");
    }

    logger.info("ai.reading.success", {
      requestId,
      readingId: request.readingId,
      tokensUsed: response.usage?.total_tokens,
    });

    return narrative;
  } catch (error) {
    logger.error("ai.reading.error", {
      requestId,
      readingId: request.readingId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

