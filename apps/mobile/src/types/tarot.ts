/**
 * Core domain types for the Tarot reading application
 * These types define the structure of cards, spreads, and reading results
 */

/**
 * Unique identifier for a tarot card
 * Stable ID used across app and backend
 */
export type CardId = string;

/**
 * Available spread types in the MVP
 * - one_card: Single card reading
 * - three_card: Past/Present/Future spread
 * - celtic_cross: Full 10-card spread (stub for MVP)
 */
export type SpreadId = "one_card" | "three_card" | "celtic_cross";

/**
 * Suit classification for tarot cards
 * - major: Major Arcana (0-21)
 * - wands, cups, swords, pentacles: Minor Arcana suits
 */
export type Suit = "major" | "wands" | "cups" | "swords" | "pentacles";

/**
 * Category-specific meanings for tarot cards
 * Each card has different interpretations based on the area of life
 */
export interface CardMeanings {
  /** Love and relationships interpretation */
  love: string;
  /** Health and wellness interpretation */
  health: string;
  /** Combined money and career interpretation */
  moneyCareer: string;
  /** Spirituality and personal growth interpretation */
  spirituality: string;
}

/**
 * Represents a single tarot card in the deck
 * Contains all static information about the card
 */
export interface TarotCard {
  /** Stable unique identifier for the card */
  id: CardId;
  /** Display name of the card (e.g., "The Fool", "Ace of Wands") */
  name: string;
  /** Suit classification (optional for Major Arcana) */
  suit?: Suit;
  /** Card number within suit (optional, e.g., minor arcana number 1-14) */
  number?: number;
  /** Local asset key or filename for card image */
  imageAsset: string;
  /** Array of keywords associated with the card */
  keywords: string[];
  /** Short meaning when card is upright */
  meaningUpright: string;
  /** Short meaning when card is reversed (optional) */
  meaningReversed?: string;
  /** Longer descriptive text about the card (upright) */
  description: string;
  /** Category-specific meanings when card is upright */
  meaningsUpright: CardMeanings;
  /** Category-specific meanings when card is reversed */
  meaningsReversed: CardMeanings;
  /** Longer descriptive text about the card when reversed */
  descriptionReversed: string;
}

/**
 * Represents a position within a spread
 * Each position has semantic meaning (e.g., "Past", "Present", "Future")
 */
export interface SpreadPosition {
  /** Zero-based index of position in the spread */
  index: number;
  /** Human-readable label (e.g., "Past", "Present", "Future") */
  label: string;
  /** Prompt text used for AI narrative generation */
  prompt: string;
}

/**
 * Defines a tarot spread configuration
 * Includes card count, credit cost, and positional meanings
 */
export interface TarotSpread {
  /** Unique identifier for the spread */
  id: SpreadId;
  /** Display name shown to users */
  displayName: string;
  /** Short description of what the reading is about or how it's best used */
  description?: string;
  /** Number of cards drawn in this spread */
  cardCount: number;
  /** Credit cost to perform this reading */
  creditCost: number;
  /** Array of position definitions */
  positions: SpreadPosition[];
}

/**
 * User input for creating a new reading
 */
export interface ReadingDraftInput {
  /** Selected spread type */
  spreadId: SpreadId;
  /** Optional user question or intent */
  question?: string;
  /** Whether to allow reversed cards (MVP default: false) */
  allowReversals: boolean;
}

/**
 * Represents a card drawn during a reading
 * Includes position and orientation information
 */
export interface DrawnCard {
  /** ID of the card that was drawn */
  cardId: CardId;
  /** Whether the card is reversed */
  isReversed: boolean;
  /** Position index in the spread (0-based) */
  positionIndex: number;
}

/**
 * Complete reading result stored locally
 * Contains all card information and optional AI narrative
 */
export interface ReadingResultLocal {
  /** Unique identifier for this reading session */
  readingId: string;
  /** ISO timestamp when reading was created */
  createdAtIso: string;
  /** Spread type used */
  spreadId: SpreadId;
  /** Optional user question */
  question?: string;
  /** Array of cards drawn in this reading */
  drawnCards: DrawnCard[];
  /** Static meaning payload computed on-device */
  perCardText: Array<{
    /** Card identifier */
    cardId: CardId;
    /** Display title combining card name and position (e.g., "The Sun — Past") */
    title: string;
    /** Meaning text (upright or reversed) */
    meaning: string;
    /** Full description of the card (upright or reversed) */
    description: string;
    /** Category-specific meanings (love, health, money & career, spirituality) */
    categoryMeanings: CardMeanings;
  }>;
  /** AI-generated narrative (filled after backend call) */
  aiNarrative?: string;
}
