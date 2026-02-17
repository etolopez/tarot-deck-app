/**
 * Parses a multi-card plain text (converted from DOCX) and writes concise,
 * personalized summaries into apps/mobile/src/data/tarot/cards.json.
 *
 * Usage:
 *   node scripts/ingest_multi_cards.js scripts/input/doc1.txt
 */

const fs = require('fs');
const path = require('path');

const CARDS_PATH = path.join(__dirname, '..', 'apps', 'mobile', 'src', 'data', 'tarot', 'cards.json');

// Map display names to card IDs in cards.json
const NAME_TO_ID = {
  'The Fool': 'fool',
  'The Magician': 'magician',
  'The High Priestess': 'high_priestess',
  'The Empress': 'empress',
  'The Emperor': 'emperor',
  'The Hierophant': 'hierophant',
  'The Lovers': 'lovers',
  'The Chariot': 'chariot',
  'Strength': 'strength',
  'The Hermit': 'hermit',
  'Wheel of Fortune': 'wheel_of_fortune',
  'Justice': 'justice',
  'The Hanged Man': 'hanged_man',
  'Death': 'death',
  'Temperance': 'temperance',
  'The Devil': 'devil',
  'The Tower': 'tower',
  'The Star': 'star',
  'The Moon': 'moon',
  'The Sun': 'sun',
  'Judgement': 'judgement',
  'The World': 'world',
};

const SUITS = ['wands','cups','swords','pentacles'];
const RANKS = ['ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'];

function nameToIdFallback(name) {
  // Expect formats like "Ace of Wands", "Ten of Cups", etc.
  const m = name.match(/^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King)\s+of\s+(Wands|Cups|Swords|Pentacles)$/i);
  if (!m) return null;
  const rank = m[1].toLowerCase();
  const suit = m[2].toLowerCase();
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return `${rank}_${suit}`;
}

function summarize(text, { maxSentences = 2 } = {}) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

function personalize(s) {
  if (!s) return s;
  let t = s;
  // Tone: concise, present tense, common language
  t = t.replace(/you will/gi, 'you');
  t = t.replace(/you’ll/gi, 'you');
  t = t.replace(/can indicate/gi, 'can show');
  t = t.replace(/indicates/gi, 'shows');
  t = t.replace(/be careful/gi, 'be mindful');
  // Remove boilerplate prefixes
  t = t.replace(/^(?:In a|In an|In)\s+(?:love|health|career|money|money & career|spirituality)\s+(?:context|tarot (?:spread|reading))[:,]?\s*/i, '');
  t = t.replace(/^(?:Financially|Career-wise|Health-wise|Spiritually),?\s*/i, '');
  // Remove references to "in your Tarot reading"
  t = t.replace(/in your tarot (?:spread|reading)/gi, '');
  // Drop leading "This card" if present
  t = t.replace(/^\s*This card\b[\s:.,-]*/i, '');
  // Clean up leftover double spaces
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function extractBetween(text, startPattern, endPattern) {
  const start = text.search(startPattern);
  if (start === -1) return '';
  const sliced = text.slice(start);
  const end = endPattern ? sliced.search(endPattern) : -1;
  const chunk = end > 0 ? sliced.slice(0, end) : sliced;
  return chunk.replace(startPattern, '').trim();
}

function extractSections(raw) {
  const text = raw.replace(/\r\n/g, '\n');

  const upLove = extractBetween(
    text,
    /Love\s*(?:&|and)?\s*Relationships?\s*\(Upright\)\s*/i,
    /(Money\s*&?\s*Career\s*\(Upright\)|Health\s*\(Upright\)|Spirituality\s*\(Upright\)|Reversed Meaning Guide|\n\s*-\s*The\s|\n\s*-\s*[A-Z])/i
  );
  const upMoney = extractBetween(
    text,
    /(Money\s*(?:&|and)?\s*Career|Career\s*(?:&|and)?\s*Money)\s*\(Upright\)\s*/i,
    /(Health\s*\(Upright\)|Spirituality\s*\(Upright\)|Reversed Meaning Guide|\n\s*-\s*The\s|\n\s*-\s*[A-Z])/i
  );
  const upHealth = extractBetween(
    text,
    /Health\s*\(Upright\)\s*/i,
    /(Spirituality\s*\(Upright\)|Reversed Meaning Guide|\n\s*-\s*The\s|\n\s*-\s*[A-Z])/i
  );
  const upSpirit = extractBetween(
    text,
    /Spirituality\s*\(Upright\)\s*/i,
    /(Reversed Meaning Guide|\n\s*-\s*The\s|\n\s*-\s*[A-Z])/i
  );

  const revDesc = extractBetween(
    text,
    /(General\s+meaning\s+and\s+interpretation\s*\(Reversed\)\s*)/i,
    /(Love\s*&?\s*Relationships?\s*\(Reversed\)|\n\s*-\s*The\s|\n\s*-\s*[A-Z])/i
  );
  const revLove = extractBetween(
    text,
    /Love\s*(?:&|and)?\s*Relationships?\s*\(Reversed\)\s*/i,
    /(Money\s*&?\s*Career\s*\(Reversed\)|Health\s*\(Reversed\)|Spirituality\s*\(Reversed\)|\n\s*-\s*The\s|\n\s*-\s*[A-Z]|Upright Meaning Guide)/i
  );
  const revMoney = extractBetween(
    text,
    /(Money\s*(?:&|and)?\s*Career|Career\s*(?:&|and)?\s*Money)\s*\(Reversed\)\s*/i,
    /(Health\s*\(Reversed\)|Spirituality\s*\(Reversed\)|\n\s*-\s*The\s|\n\s*-\s*[A-Z]|Upright Meaning Guide)/i
  );
  const revHealth = extractBetween(
    text,
    /Health\s*\(Reversed\)\s*/i,
    /(Spirituality\s*\(Reversed\)|\n\s*-\s*The\s|\n\s*-\s*[A-Z]|Upright Meaning Guide)/i
  );
  const revSpirit = extractBetween(
    text,
    /Spirituality\s*\(Reversed\)\s*/i,
    /(\n\s*-\s*The\s|\n\s*-\s*[A-Z]|Upright Meaning Guide|$)/i
  );

  return {
    upright: {
      love: personalize(summarize(upLove)),
      health: personalize(summarize(upHealth)),
      moneyCareer: personalize(summarize(upMoney)),
      spirituality: personalize(summarize(upSpirit)),
    },
    reversed: {
      love: personalize(summarize(revLove)),
      health: personalize(summarize(revHealth)),
      moneyCareer: personalize(summarize(revMoney)),
      spirituality: personalize(summarize(revSpirit)),
      description: personalize(summarize(revDesc, { maxSentences: 3, maxChars: 650 })),
    },
  };
}

function splitCards(raw) {
  const lines = raw.split(/\r?\n/);
  const indexes = [];
  const nameAt = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*-\s*(.+?)\s*(?:—\s+https?:\/\/\S+)?\s*$/);
    if (m) {
      indexes.push(i);
      nameAt.push(m[1].trim());
    }
  }
  const chunks = [];
  for (let j = 0; j < indexes.length; j++) {
    const start = indexes[j];
    const end = j + 1 < indexes.length ? indexes[j + 1] : lines.length;
    const name = nameAt[j];
    const text = lines.slice(start, end).join('\n');
    chunks.push({ name, text });
  }
  return chunks;
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/ingest_multi_cards.js <textFile>');
    process.exit(1);
  }
  const raw = fs.readFileSync(input, 'utf8');
  const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  const byId = new Map(cards.map(c => [c.id, c]));

  const chunks = splitCards(raw);
  let updated = 0;
  const touched = [];

  for (const { name, text } of chunks) {
    let id = NAME_TO_ID[name];
    if (!id) {
      id = nameToIdFallback(name);
    }
    if (!id) continue;
    const card = byId.get(id);
    if (!card) continue;
    const sections = extractSections(text);
    // Skip if we extracted nothing
    const hasAny = Object.values(sections.upright).some(Boolean) || Object.values(sections.reversed).some(Boolean);
    if (!hasAny) continue;

    card.meaningsUpright = {
      love: sections.upright.love || card.meaningsUpright.love,
      health: sections.upright.health || card.meaningsUpright.health,
      moneyCareer: sections.upright.moneyCareer || card.meaningsUpright.moneyCareer,
      spirituality: sections.upright.spirituality || card.meaningsUpright.spirituality,
    };
    card.meaningsReversed = {
      love: sections.reversed.love || card.meaningsReversed.love,
      health: sections.reversed.health || card.meaningsReversed.health,
      moneyCareer: sections.reversed.moneyCareer || card.meaningsReversed.moneyCareer,
      spirituality: sections.reversed.spirituality || card.meaningsReversed.spirituality,
    };
    if (sections.reversed.description) {
      card.descriptionReversed = sections.reversed.description;
    }
    updated++;
    touched.push(id);
  }

  fs.writeFileSync(CARDS_PATH, JSON.stringify(Array.from(byId.values()), null, 2), 'utf8');
  console.log(`✅ Personalized updates applied from ${path.basename(input)} — updated ${updated} cards.`);
  console.log('Cards touched:', touched.join(', '));
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}
