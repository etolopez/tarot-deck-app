/**
 * TarotEngine - Pure logic for tarot reading operations
 * No UI, no storage - just pure functions for shuffling, drawing, and building results
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import type {
  TarotCard,
  TarotSpread,
  ReadingDraftInput,
  DrawnCard,
  ReadingResultLocal,
} from "../types/tarot";

/**
 * Creates a reading draft with a unique ID
 * Validates the spread exists and prepares the reading structure
 */
export function createReadingDraft(
  input: ReadingDraftInput,
  spread: TarotSpread
): { readingId: string; spread: TarotSpread } {
  logger.info("reading.draft.create", {
    readingId: "pending",
    spreadId: input.spreadId,
  });

  const readingId = uuidv4();

  logger.info("reading.draft.created", {
    readingId,
    spreadId: input.spreadId,
    question: input.question || null,
  });

  return {
    readingId,
    spread,
  };
}

/**
 * Fisher-Yates shuffle algorithm
 * Produces a uniformly random permutation of the array
 */
function fisherYatesShuffle<T>(array: T[], rng: () => number = Math.random): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating input
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draws cards from the deck for a reading
 * Uses Fisher-Yates shuffle to ensure random selection
 * Optionally applies reversals based on allowReversals flag
 */
export function drawCards(
  spread: TarotSpread,
  cards: TarotCard[],
  allowReversals: boolean
): DrawnCard[] {
  logger.info("reading.draw.start", {
    spreadId: spread.id,
    cardCount: spread.cardCount,
    allowReversals,
  });

  // Get all card IDs
  const deckIds = cards.map((card) => card.id);

  // Shuffle the deck
  const shuffled = fisherYatesShuffle(deckIds);

  // Select the first N cards for the spread
  const selectedIds = shuffled.slice(0, spread.cardCount);

  // Build DrawnCard objects with optional reversals
  // To prevent clustering of reversed cards, shuffle reversal states separately
  // This ensures better distribution of reversed vs upright cards
  let drawnCards: DrawnCard[];
  if (allowReversals) {
    // Create an array of reversal states with roughly 50% reversed
    // Use a balanced approach: for even counts, split 50/50; for odd, round up/down
    const reversedCount = Math.round(spread.cardCount / 2);
    const reversalStates = Array.from(
      { length: spread.cardCount },
      (_, i) => i < reversedCount
    );
    // Shuffle the reversal states to distribute them randomly across cards
    const shuffledReversals = fisherYatesShuffle(reversalStates);
    
    drawnCards = selectedIds.map((cardId, idx) => ({
      cardId,
      isReversed: shuffledReversals[idx],
      positionIndex: idx,
    }));
  } else {
    drawnCards = selectedIds.map((cardId, idx) => ({
      cardId,
      isReversed: false,
      positionIndex: idx,
    }));
  }

  logger.info("reading.draw.complete", {
    spreadId: spread.id,
    cardCount: drawnCards.length,
    reversedCount: drawnCards.filter((c) => c.isReversed).length,
  });

  return drawnCards;
}

/**
 * Builds the per-card text for a reading
 * Combines card meaning with position label
 */
function buildPerCardText(
  drawnCard: DrawnCard,
  spread: TarotSpread,
  card: TarotCard
): {
  cardId: string;
  title: string;
  meaning: string;
  description: string;
  categoryMeanings: import("../types/tarot").CardMeanings;
} {
  const position = spread.positions[drawnCard.positionIndex];
  if (!position) {
    throw new Error(
      `Position index ${drawnCard.positionIndex} not found in spread ${spread.id}`
    );
  }

  // Select meaning based on reversal
  const meaning =
    drawnCard.isReversed && card.meaningReversed
      ? card.meaningReversed
      : card.meaningUpright;

  // Select description based on reversal
  const description = drawnCard.isReversed
    ? card.descriptionReversed || card.description
    : card.description;

  // Select category meanings based on reversal
  const categoryMeanings = drawnCard.isReversed
    ? card.meaningsReversed
    : card.meaningsUpright;

  // Build title: "Card Name — Position Label"
  const title = `${card.name}${drawnCard.isReversed ? " (Reversed)" : ""} — ${position.label}`;

  return {
    cardId: card.id,
    title,
    meaning,
    description,
    categoryMeanings,
  };
}

/**
 * Builds a complete ReadingResultLocal from draft and drawn cards
 * Computes all per-card text and prepares structure for AI narrative
 */
export function buildLocalResult(
  readingId: string,
  spread: TarotSpread,
  question: string | undefined,
  drawnCards: DrawnCard[],
  cardIndex: Map<string, TarotCard>
): ReadingResultLocal {
  logger.info("reading.result.build.start", { readingId });

  // Build per-card text for each drawn card
  const perCardText = drawnCards.map((drawnCard) => {
    const card = cardIndex.get(drawnCard.cardId);
    if (!card) {
      throw new Error(`Card not found: ${drawnCard.cardId}`);
    }
    return buildPerCardText(drawnCard, spread, card);
  });

  const result: ReadingResultLocal = {
    readingId,
    createdAtIso: new Date().toISOString(),
    spreadId: spread.id,
    question,
    drawnCards,
    perCardText,
    // aiNarrative will be filled after backend call
    aiNarrative: undefined,
  };

  logger.info("reading.result.build.complete", {
    readingId,
    cardCount: perCardText.length,
  });

  return result;
}

