/**
 * Card Image Mapper
 * Maps card IDs to the correct image file names from Cards-jpg folder
 */

import type { TarotCard } from "../types/tarot";

/**
 * Map card name to filename format used in Cards-jpg
 * Handles special cases for major arcana names
 * Note: The actual filenames include "The" (e.g., "00-TheFool.jpg")
 */
function formatMajorArcanaName(name: string): string {
  // Match file casing: capitalize each word, then strip spaces.
  // Example: "Wheel of Fortune" -> "WheelOfFortune"
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Map card to image filename
 * Converts card ID and suit/number to match Cards-jpg naming convention
 */
export function getCardImagePath(card: TarotCard): string {
  if (card.suit === "major") {
    // Major Arcana: 00-TheFool.jpg, 01-TheMagician.jpg, etc.
    const paddedNumber = String(card.number || 0).padStart(2, "0");
    const name = formatMajorArcanaName(card.name);
    return `${paddedNumber}-${name}.jpg`;
  } else {
    // Minor Arcana: Cups01.jpg, Swords01.jpg, Wands01.jpg, Pentacles01.jpg
    const suitName = card.suit
      ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1)
      : "";
    const paddedNumber = String(card.number || 1).padStart(2, "0");
    return `${suitName}${paddedNumber}.jpg`;
  }
}

/**
 * Get card back image filename
 */
export function getCardBackImagePath(): string {
  return "CardBacks.jpg";
}

/**
 * Get image URI for React Native Image component
 * Returns a path string that can be used with Image source
 */
export function getCardImageUri(card: TarotCard): string {
  const filename = getCardImagePath(card);
  return `Cards-jpg/${filename}`;
}

/**
 * Get card back image URI
 */
export function getCardBackImageUri(): string {
  const filename = getCardBackImagePath();
  return `Cards-jpg/${filename}`;
}

