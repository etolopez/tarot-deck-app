/**
 * Replaces any placeholder upright descriptions with a short, natural summary
 * built from the card's upright meaning and category meanings.
 *
 * Usage: node scripts/fix_placeholder_descriptions.js
 */

const fs = require('fs');
const path = require('path');

const CARDS_PATH = path.join(__dirname, '..', 'apps', 'mobile', 'src', 'data', 'tarot', 'cards.json');
const BACKUP_PATH = CARDS_PATH + '.pre-fix-placeholders.bak';

function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildDescription(card) {
  const parts = [];
  const lead = card.meaningUpright || '';
  if (lead) parts.push(cap(lead.replace(/[,;]$/,'') + '.'));
  const mu = card.meaningsUpright || {};
  const highlights = [mu.love, mu.health, mu.moneyCareer, mu.spirituality]
    .filter(Boolean)
    .map(t => t.replace(/\.$/, ''));
  if (highlights.length) {
    parts.push(cap(highlights[0]) + '.');
  }
  return parts.join(' ');
}

function needsFix(text) {
  if (!text) return true;
  const t = text.toLowerCase();
  return t.includes('placeholder description') || t.includes('will be replaced');
}

function main() {
  const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  let fixed = 0;
  for (const c of cards) {
    if (needsFix(c.description)) {
      c.description = buildDescription(c) || cap((c.meaningUpright || 'Meaning available.'));
      fixed++;
    }
  }
  fs.copyFileSync(CARDS_PATH, BACKUP_PATH);
  fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2), 'utf8');
  console.log(`✅ Fixed ${fixed} placeholder descriptions.`);
  console.log(`Backup: ${BACKUP_PATH}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

