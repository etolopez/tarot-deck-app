/**
 * Cleans and lightly personalizes category texts in cards.json.
 * Fixes malformed phrases like "This card a ...", removes boilerplate
 * leftovers, normalizes whitespace/punctuation, and ensures readability.
 *
 * Usage: node scripts/refine_card_texts.js
 */

const fs = require('fs');
const path = require('path');

const CARDS_PATH = path.join(__dirname, '..', 'apps', 'mobile', 'src', 'data', 'tarot', 'cards.json');
const BACKUP_PATH = CARDS_PATH + '.pre-refine.bak';

function tidyWhitespace(s) {
  return s.replace(/\s+/g, ' ').replace(/\s+([,.!?;:])/g, '$1').trim();
}

function ensurePeriod(s) {
  if (!s) return s;
  const end = s[s.length - 1];
  return /[.!?…]$/.test(end) ? s : s + '.';
}

function ensureCapitalized(s) {
  if (!s) return s;
  const trimmed = s.trimStart();
  if (!trimmed) return s;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function cleanupBoilerplate(s) {
  let t = s;
  // Remove ad artifacts or stray site text
  t = t.replace(/Ad ends in \d+/gi, '');
  // Remove generic context openers left behind
  t = t.replace(/^(?:In a |In an |In )?(?:love|health|career|money|money & career|spirituality) (?:context|tarot (?:spread|reading))[:,]\s*/i, '');
  t = t.replace(/^(?:Financially|Career-wise|Health-wise|Spiritually),?\s*/gi, '');
  // Remove leading "This card" artifacts entirely for common language
  t = t.replace(/^\s*(?:This card\b[\s:.,-]*)+/i, '');
  // Replace mid-sentence "This card" with "it"
  t = t.replace(/\bThis card\b/gi, 'it');
  // Remove "in your Tarot reading/spread" tails
  t = t.replace(/\b(?:in|with) (?:your )?tarot (?:reading|spread)\b/gi, '');
  // Normalize spacing and punctuation
  t = tidyWhitespace(t);
  t = t.replace(/\s+—\s+/g, ' — ');
  // Ensure sentence end punctuation
  t = ensurePeriod(t);
  // Ensure first letter capitalized
  t = ensureCapitalized(t);
  return t;
}

function refineText(s) {
  if (!s || typeof s !== 'string') return s;
  let t = s;
  t = cleanupBoilerplate(t);
  return t;
}

function processCard(card) {
  const fields = [
    ['meaningsUpright', 'love'],
    ['meaningsUpright', 'health'],
    ['meaningsUpright', 'moneyCareer'],
    ['meaningsUpright', 'spirituality'],
    ['meaningsReversed', 'love'],
    ['meaningsReversed', 'health'],
    ['meaningsReversed', 'moneyCareer'],
    ['meaningsReversed', 'spirituality'],
  ];
  let changed = false;
  for (const [group, key] of fields) {
    if (card[group] && typeof card[group][key] === 'string') {
      const before = card[group][key];
      const after = refineText(before);
      if (after !== before) {
        card[group][key] = after;
        changed = true;
      }
    }
  }
  if (typeof card.descriptionReversed === 'string') {
    const before = card.descriptionReversed;
    const after = refineText(before);
    if (after !== before) {
      card.descriptionReversed = after;
      changed = true;
    }
  }
  return changed;
}

function main() {
  const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  let updated = 0;
  for (const card of cards) {
    if (processCard(card)) updated++;
  }
  fs.copyFileSync(CARDS_PATH, BACKUP_PATH);
  fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2), 'utf8');
  console.log(`✅ Refined texts for ${updated} cards.`);
  console.log(`Backup saved: ${BACKUP_PATH}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error('Refine failed:', e); process.exit(1); }
}
