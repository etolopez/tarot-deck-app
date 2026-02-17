/**
 * Tarot data loader with runtime validation
 * Loads and validates cards.json and spreads.json using Zod schemas
 * Fails fast with clear error messages if data is invalid
 */

import { z } from "zod";
import { logger } from "../../core/logger";
import type { TarotCard, TarotSpread } from "../../types/tarot";

/**
 * Zod schema for validating CardMeanings
 */
const CardMeaningsSchema = z.object({
  love: z.string(),
  health: z.string(),
  moneyCareer: z.string(),
  spirituality: z.string(),
});

/**
 * Zod schema for validating TarotCard
 */
const TarotCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  suit: z.enum(["major", "wands", "cups", "swords", "pentacles"]).optional(),
  number: z.number().optional(),
  imageAsset: z.string(),
  keywords: z.array(z.string()),
  meaningUpright: z.string(),
  meaningReversed: z.string().optional(),
  description: z.string(),
  meaningsUpright: CardMeaningsSchema,
  meaningsReversed: CardMeaningsSchema,
  descriptionReversed: z.string(),
});

/**
 * Zod schema for validating SpreadPosition
 */
const SpreadPositionSchema = z.object({
  index: z.number(),
  label: z.string(),
  prompt: z.string(),
});

/**
 * Zod schema for validating TarotSpread
 */
const TarotSpreadSchema = z.object({
  id: z.enum(["one_card", "three_card", "celtic_cross"]),
  displayName: z.string(),
  description: z.string().optional(),
  cardCount: z.number(),
  creditCost: z.number(),
  positions: z.array(SpreadPositionSchema),
});

/**
 * In-memory storage for loaded data
 */
let cardsMap: Map<string, TarotCard> | null = null;
let spreadsMap: Map<string, TarotSpread> | null = null;

/**
 * Load and validate cards.json
 * Returns a map of cardId -> TarotCard for fast lookups
 */
export async function loadCards(): Promise<Map<string, TarotCard>> {
  if (cardsMap) {
    return cardsMap;
  }

  logger.info("tarot.data.load.start", { type: "cards" });

  try {
    // In React Native, we need to import JSON files directly
    // For now, we'll use require which works in Metro bundler
    const cardsData = require("./cards.json");
    
    // Validate the entire array
    const validatedCards = z.array(TarotCardSchema).parse(cardsData);
    
    // Build map for O(1) lookups
    cardsMap = new Map();
    for (const card of validatedCards) {
      cardsMap.set(card.id, card);
    }

    logger.info("tarot.data.load.success", {
      type: "cards",
      count: cardsMap.size,
    });

    return cardsMap;
  } catch (error) {
    logger.error("tarot.data.load.failed", {
      type: "cards",
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof z.ZodError ? error.errors : undefined,
    });
    throw new Error(
      `Failed to load cards: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load and validate spreads.json
 * Returns a map of spreadId -> TarotSpread for fast lookups
 */
export async function loadSpreads(): Promise<Map<string, TarotSpread>> {
  if (spreadsMap) {
    return spreadsMap;
  }

  logger.info("tarot.data.load.start", { type: "spreads" });

  try {
    const spreadsData = require("./spreads.json");
    
    // Validate the entire array
    const validatedSpreads = z.array(TarotSpreadSchema).parse(spreadsData);
    
    // Build map for O(1) lookups
    spreadsMap = new Map();
    for (const spread of validatedSpreads) {
      spreadsMap.set(spread.id, spread);
    }

    logger.info("tarot.data.load.success", {
      type: "spreads",
      count: spreadsMap.size,
    });

    return spreadsMap;
  } catch (error) {
    logger.error("tarot.data.load.failed", {
      type: "spreads",
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof z.ZodError ? error.errors : undefined,
    });
    throw new Error(
      `Failed to load spreads: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Initialize all tarot data
 * Call this at app startup to preload and validate all data
 */
export async function initializeTarotData(): Promise<void> {
  await Promise.all([loadCards(), loadSpreads()]);
}

/**
 * Get a card by ID
 * Throws if card not found
 */
export function getCard(cardId: string): TarotCard {
  if (!cardsMap) {
    throw new Error("Cards not loaded. Call loadCards() first.");
  }
  const card = cardsMap.get(cardId);
  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }
  return card;
}

/**
 * Get a spread by ID
 * Throws if spread not found
 */
export function getSpread(spreadId: string): TarotSpread {
  if (!spreadsMap) {
    throw new Error("Spreads not loaded. Call loadSpreads() first.");
  }
  const spread = spreadsMap.get(spreadId);
  if (!spread) {
    throw new Error(`Spread not found: ${spreadId}`);
  }
  return spread;
}

/**
 * Get all cards as an array
 */
export function getAllCards(): TarotCard[] {
  if (!cardsMap) {
    throw new Error("Cards not loaded. Call loadCards() first.");
  }
  return Array.from(cardsMap.values());
}

/**
 * Get all spreads as an array
 */
export function getAllSpreads(): TarotSpread[] {
  if (!spreadsMap) {
    throw new Error("Spreads not loaded. Call loadSpreads() first.");
  }
  return Array.from(spreadsMap.values());
}

