/**
 * Card of the Day utility
 * Selects a card deterministically based on the current date
 * Same card for the same day (changes at midnight)
 */

import type { TarotCard } from "../types/tarot";

/**
 * Get a deterministic card index based on the current date
 * Uses year + day-of-year to ensure same card for same day
 * @param totalCards Total number of cards in the deck
 * @returns Index (0-based) of the card for today
 */
function getCardIndexForToday(totalCards: number): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  // Combine year and day-of-year for variety across years
  const seed = now.getFullYear() * 366 + dayOfYear;
  return seed % totalCards;
}

/**
 * Get the Card of the Day
 * Always returns an upright card (not reversed)
 * @param allCards Array of all tarot cards
 * @returns The card selected for today
 */
export function getCardOfTheDay(allCards: TarotCard[]): TarotCard {
  if (allCards.length === 0) {
    throw new Error("No cards available");
  }
  const index = getCardIndexForToday(allCards.length);
  return allCards[index];
}
