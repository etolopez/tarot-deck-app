/**
 * Adds any missing Minor Arcana cards to apps/mobile/src/data/tarot/cards.json
 * with lightweight placeholders. Intended to prep for merging real content.
 */

const fs = require('fs');
const path = require('path');

const CARDS_PATH = path.join(__dirname, '..', 'apps', 'mobile', 'src', 'data', 'tarot', 'cards.json');
const BACKUP_PATH = CARDS_PATH + '.pre-minors.bak';

const suits = ['wands', 'cups', 'swords', 'pentacles'];
const ranks = [
  'ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'
];

const rankMeta = {
  ace: { label: 'Ace', number: 1 },
  two: { label: 'Two', number: 2 },
  three: { label: 'Three', number: 3 },
  four: { label: 'Four', number: 4 },
  five: { label: 'Five', number: 5 },
  six: { label: 'Six', number: 6 },
  seven: { label: 'Seven', number: 7 },
  eight: { label: 'Eight', number: 8 },
  nine: { label: 'Nine', number: 9 },
  ten: { label: 'Ten', number: 10 },
  page: { label: 'Page', number: 11 },
  knight: { label: 'Knight', number: 12 },
  queen: { label: 'Queen', number: 13 },
  king: { label: 'King', number: 14 },
};

const suitMeta = {
  wands: { label: 'Wands', keywords: ['drive','creativity','initiative','fire'] },
  cups: { label: 'Cups', keywords: ['emotion','relationships','intuition','water'] },
  swords: { label: 'Swords', keywords: ['thought','clarity','truth','air'] },
  pentacles: { label: 'Pentacles', keywords: ['work','money','body','earth'] },
};

function placeholderMeanings(title) {
  const base = `${title} themes in this area.`;
  return {
    love: base,
    health: base,
    moneyCareer: base,
    spirituality: base,
  };
}

function buildCard(rank, suit) {
  const r = rankMeta[rank];
  const s = suitMeta[suit];
  const id = `${rank}_${suit}`;
  const name = `${r.label} of ${s.label}`;
  const title = `${name}`;
  const keywords = [rank, suit, ...s.keywords];
  return {
    id,
    name,
    suit,
    number: r.number,
    imageAsset: `${id}.png`,
    keywords,
    meaningUpright: `${name} upright themes: ${s.keywords.join(', ')}`,
    meaningReversed: `${name} reversed themes: ${s.keywords.join(', ')}`,
    description: `${name}: Placeholder description. Replace with summarized meanings as needed.`,
    meaningsUpright: placeholderMeanings(`${title} (upright)`),
    meaningsReversed: placeholderMeanings(`${title} (reversed)`),
    descriptionReversed: `When ${name} appears reversed, interpret the energy as internalized, delayed, or imbalanced. Placeholder text to be replaced.`,
  };
}

function main() {
  const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  const existingIds = new Set(cards.map((c) => c.id));
  const toAdd = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      const id = `${rank}_${suit}`;
      if (!existingIds.has(id)) {
        toAdd.push(buildCard(rank, suit));
      }
    }
  }

  if (!toAdd.length) {
    console.log('No missing minors found. cards.json already contains all 56 minor arcana.');
    return;
  }

  // Backup and write
  fs.copyFileSync(CARDS_PATH, BACKUP_PATH);
  const updated = [...cards, ...toAdd];
  fs.writeFileSync(CARDS_PATH, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`✅ Added ${toAdd.length} minor arcana placeholders.`);
  console.log(`Backup saved: ${BACKUP_PATH}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

