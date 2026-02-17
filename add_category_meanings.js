/**
 * Script to add category meanings structure to all cards
 * Adds placeholder category meanings that can be replaced with real content as needed.
 */

const fs = require('fs');
const path = require('path');

const cardsFile = path.join(__dirname, 'apps/mobile/src/data/tarot/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsFile, 'utf8'));

/**
 * Generate placeholder category meanings based on card meaning
 */
function generatePlaceholderMeanings(meaning, isReversed = false) {
  const prefix = isReversed ? "When reversed, " : "";
  return {
    love: `${prefix}In love, ${meaning.toLowerCase()}. This card suggests being thoughtful about relationships and considering the emotional aspects of your connections.`,
    health: `${prefix}In health, ${meaning.toLowerCase()}. This card indicates paying attention to your physical and mental wellbeing, and taking a balanced approach to your health.`,
    money: `${prefix}In money matters, ${meaning.toLowerCase()}. This card suggests being mindful of your financial situation and making thoughtful decisions about money.`,
    career: `${prefix}In career, ${meaning.toLowerCase()}. This card indicates considering your professional path and making decisions that align with your career goals.`,
    spirituality: `${prefix}In spirituality, ${meaning.toLowerCase()}. This card suggests reflecting on your spiritual journey and being open to growth and understanding.`
  };
}

// Update all cards
let updated = 0;
cards.forEach(card => {
  if (!card.meaningsUpright) {
    card.meaningsUpright = generatePlaceholderMeanings(card.meaningUpright, false);
    updated++;
  }
  
  if (!card.meaningsReversed) {
    const reversedMeaning = card.meaningReversed || card.meaningUpright;
    card.meaningsReversed = generatePlaceholderMeanings(reversedMeaning, true);
    updated++;
  }
  
  if (!card.descriptionReversed) {
    card.descriptionReversed = `When ${card.name} appears reversed, it suggests a different interpretation of the card's energy. The reversed position indicates that the qualities of this card may be blocked, delayed, or manifesting in an internal way. ${card.meaningReversed || card.meaningUpright}. This is a time to reflect on how these energies are affecting your life and to consider alternative approaches to the situations you are facing.`;
    updated++;
  }
});

// Write back to file
fs.writeFileSync(cardsFile, JSON.stringify(cards, null, 2), 'utf8');

console.log(`✅ Updated ${updated} card fields`);
console.log(`✅ All ${cards.length} cards now have category meanings structure`);
console.log('');
console.log('⚠️  NOTE: These are placeholder meanings.');
console.log('   Replace placeholders with your chosen category-specific meanings as needed.');
console.log('   See UPDATE_CARDS_GUIDE.md for instructions.');

