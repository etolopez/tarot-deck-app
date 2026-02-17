/**
 * Merge summarized meanings from card export JSON into cards.json
 *
 * Input: scripts/input/card_export.json
 * Output: updates apps/mobile/src/data/tarot/cards.json in-place (with a .bak backup)
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, 'input', 'card_export.json');
const CARDS_PATH = path.join(__dirname, '..', 'apps', 'mobile', 'src', 'data', 'tarot', 'cards.json');
const BACKUP_PATH = CARDS_PATH + '.bak';

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function safeWriteJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

function summarize(text, { maxSentences = 2 } = {}) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

function combineMoneyCareer(uMoney, uCareer) {
  const combined = [uMoney, uCareer].filter(Boolean).join(' ');
  return summarize(combined, { maxSentences: 3 });
}

const MAJOR_SLUG_TO_ID = {
  'the-fool': 'fool',
  'the-magician': 'magician',
  'the-high-priestess': 'high_priestess',
  'the-empress': 'empress',
  'the-emperor': 'emperor',
  'the-hierophant': 'hierophant',
  'the-lovers': 'lovers',
  'the-chariot': 'chariot',
  strength: 'strength',
  'the-hermit': 'hermit',
  'wheel-of-fortune': 'wheel_of_fortune',
  justice: 'justice',
  'the-hanged-man': 'hanged_man',
  death: 'death',
  temperance: 'temperance',
  'the-devil': 'devil',
  'the-tower': 'tower',
  'the-star': 'star',
  'the-moon': 'moon',
  'the-sun': 'sun',
  judgement: 'judgement',
  'the-world': 'world',
};

const MINOR_RANKS = new Set([
  'ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'
]);
const MINOR_SUITS = new Set(['wands','cups','swords','pentacles']);

function slugToId(slug) {
  if (!slug) return null;
  if (MAJOR_SLUG_TO_ID[slug]) return MAJOR_SLUG_TO_ID[slug];

  // Minor arcana pattern: {rank}-of-{suit}
  const m = slug.match(/^([a-z-]+)-of-([a-z-]+)$/);
  if (m) {
    const rank = m[1];
    const suit = m[2];
    if (MINOR_RANKS.has(rank) && MINOR_SUITS.has(suit)) {
      return `${rank}_${suit}`;
    }
  }
  return null;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Missing input file: ${INPUT_PATH}`);
    console.error('Please place the card export JSON into scripts/input/ as card_export.json.');
    process.exit(1);
  }
  const exportData = loadJson(INPUT_PATH);
  const cards = loadJson(CARDS_PATH);

  // Build index by id
  const cardsById = new Map(cards.map((c) => [c.id, c]));

  let updated = 0;
  let skipped = 0;
  let missing = [];

  for (const item of exportData.results || []) {
    const { slug, sections } = item;
    const id = slugToId(slug);
    if (!id) {
      missing.push({ slug, reason: 'no id mapping' });
      continue;
    }
    const card = cardsById.get(id);
    if (!card) {
      missing.push({ slug, id, reason: 'card id not found in cards.json' });
      continue;
    }
    if (!sections) {
      skipped++;
      continue;
    }

    const up = sections.upright || {};
    const rev = sections.reversed || {};

    // Prepare summaries
    const upLove = summarize(up.love);
    const upHealth = summarize(up.health);
    const upMoneyCareer = combineMoneyCareer(up.money, up.career);
    const upSpirituality = summarize(up.spirituality);

    const revLove = summarize(rev.love);
    const revHealth = summarize(rev.health);
    const revMoneyCareer = combineMoneyCareer(rev.money, rev.career);
    const revSpirituality = summarize(rev.spirituality);
    const revDesc = summarize(rev.description || rev.intro, { maxSentences: 3 });

    // Only write when we have at least one upright/reversed field present
    let wrote = false;

    card.meaningsUpright = card.meaningsUpright || { love: '', health: '', moneyCareer: '', spirituality: '' };
    if (upLove) { card.meaningsUpright.love = upLove; wrote = true; }
    if (upHealth) { card.meaningsUpright.health = upHealth; wrote = true; }
    if (upMoneyCareer) { card.meaningsUpright.moneyCareer = upMoneyCareer; wrote = true; }
    if (upSpirituality) { card.meaningsUpright.spirituality = upSpirituality; wrote = true; }

    card.meaningsReversed = card.meaningsReversed || { love: '', health: '', moneyCareer: '', spirituality: '' };
    if (revLove) { card.meaningsReversed.love = revLove; wrote = true; }
    if (revHealth) { card.meaningsReversed.health = revHealth; wrote = true; }
    if (revMoneyCareer) { card.meaningsReversed.moneyCareer = revMoneyCareer; wrote = true; }
    if (revSpirituality) { card.meaningsReversed.spirituality = revSpirituality; wrote = true; }

    if (revDesc) { card.descriptionReversed = revDesc; wrote = true; }

    if (wrote) updated++;
    else skipped++;
  }

  // Backup and write
  fs.copyFileSync(CARDS_PATH, BACKUP_PATH);
  safeWriteJson(CARDS_PATH, cards);

  console.log(`✅ Merge complete: updated=${updated}, skipped=${skipped}`);
  if (missing.length) {
    console.warn(`⚠️  Missing mappings (${missing.length}):`);
    missing.slice(0, 10).forEach((m) => console.warn(' -', m.slug, '=>', m.id || '(none)', '-', m.reason));
    if (missing.length > 10) console.warn(` ... and ${missing.length - 10} more`);
  }
  console.log(`Backup saved: ${BACKUP_PATH}`);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('Merge failed:', e);
    process.exit(1);
  }
}
