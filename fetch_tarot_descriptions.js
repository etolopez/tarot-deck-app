/**
 * Outputs card id -> URL slug mapping for reference when updating cards.json.
 * Use your own sources; no external links are included.
 *
 * Usage: node fetch_tarot_descriptions.js
 * Then use the slug list to look up or paste descriptions into cards.json as needed.
 */

const cardMapping = {
  "fool": "the-fool",
  "magician": "the-magician",
  "high_priestess": "the-high-priestess",
  "empress": "the-empress",
  "emperor": "the-emperor",
  "hierophant": "the-hierophant",
  "lovers": "the-lovers",
  "chariot": "the-chariot",
  "strength": "strength",
  "hermit": "the-hermit",
  "wheel_of_fortune": "wheel-of-fortune",
  "justice": "justice",
  "hanged_man": "the-hanged-man",
  "death": "death",
  "temperance": "temperance",
  "devil": "the-devil",
  "tower": "the-tower",
  "star": "the-star",
  "moon": "the-moon",
  "sun": "the-sun",
  "judgement": "judgement",
  "world": "the-world",
  "ace_wands": "ace-of-wands",
  "two_wands": "two-of-wands",
  "three_wands": "three-of-wands",
  "ace_cups": "ace-of-cups",
  "two_cups": "two-of-cups",
  "three_cups": "three-of-cups",
  "ace_swords": "ace-of-swords",
  "two_swords": "two-of-swords",
  "three_swords": "three-of-swords",
  "ace_pentacles": "ace-of-pentacles",
  "two_pentacles": "two-of-pentacles",
  "three_pentacles": "three-of-pentacles",
};

console.log("Card id -> slug (for reference when updating cards.json):");
console.log("==========================================================");
Object.entries(cardMapping).forEach(([id, slug]) => {
  console.log(`${id}: ${slug}`);
});
