/**
 * Ingests a plain text dump (converted from DOCX) for a single card and writes
 * summarized sections into apps/mobile/src/data/tarot/cards.json.
 *
 * Usage:
 *   node scripts/ingest_text_to_card.js <textFile> <cardId>
 * Example:
 *   node scripts/ingest_text_to_card.js scripts/input/doc1.txt fool
 */

const fs = require('fs');
const path = require('path');

const CARDS_PATH = path.join(__dirname, '..', 'apps', 'mobile', 'src', 'data', 'tarot', 'cards.json');

function summarize(text, { maxSentences = 3, maxChars = 500 } = {}) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  let out = sentences.slice(0, maxSentences).join(' ').trim();
  if (out.length > maxChars) {
    out = out.slice(0, maxChars - 1).trimEnd() + '…';
  }
  return out;
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
  // Normalize newlines
  const text = raw.replace(/\r\n/g, '\n');

  // Upright sections
  const upLove = extractBetween(
    text,
    /Love\s*&?\s*Relationships?\s*\(Upright\)\s*/i,
    /(Money\s*&?\s*Career\s*\(Upright\)|Health\s*\(Upright\)|Spirituality\s*\(Upright\)|Reversed Meaning Guide)/i
  );
  const upMoney = extractBetween(
    text,
    /Money\s*&?\s*Career\s*\(Upright\)\s*/i,
    /(Health\s*\(Upright\)|Spirituality\s*\(Upright\)|Reversed Meaning Guide)/i
  );
  const upHealth = extractBetween(
    text,
    /Health\s*\(Upright\)\s*/i,
    /(Spirituality\s*\(Upright\)|Reversed Meaning Guide)/i
  );
  const upSpirit = extractBetween(
    text,
    /Spirituality\s*\(Upright\)\s*/i,
    /(Reversed Meaning Guide|The\s+\w+\s+Tarot Card Key Meanings:|^\s*-\s*The\s)/i
  );

  // Reversed description and sections
  const revDesc = extractBetween(
    text,
    /(General\s+meaning\s+and\s+interpretation\s*\(Reversed\)\s*)/i,
    /(Love\s*&?\s*Relationships?\s*\(Reversed\))/i
  );
  const revLove = extractBetween(
    text,
    /Love\s*&?\s*Relationships?\s*\(Reversed\)\s*/i,
    /(Money\s*&?\s*Career\s*\(Reversed\)|Health\s*\(Reversed\)|Spirituality\s*\(Reversed\)|^\s*-\s*The\s|Upright Meaning Guide)/i
  );
  const revMoney = extractBetween(
    text,
    /Money\s*&?\s*Career\s*\(Reversed\)\s*/i,
    /(Health\s*\(Reversed\)|Spirituality\s*\(Reversed\)|^\s*-\s*The\s|Upright Meaning Guide)/i
  );
  const revHealth = extractBetween(
    text,
    /Health\s*\(Reversed\)\s*/i,
    /(Spirituality\s*\(Reversed\)|^\s*-\s*The\s|Upright Meaning Guide)/i
  );
  const revSpirit = extractBetween(
    text,
    /Spirituality\s*\(Reversed\)\s*/i,
    /(^\s*-\s*The\s|Upright Meaning Guide|$)/i
  );

  return {
    upright: {
      love: upLove,
      health: upHealth,
      moneyCareer: upMoney, // combine with career implicitly
      spirituality: upSpirit,
    },
    reversed: {
      love: revLove,
      health: revHealth,
      moneyCareer: revMoney,
      spirituality: revSpirit,
      description: revDesc,
    },
  };
}

function main() {
  const [,, textFile, cardId] = process.argv;
  if (!textFile || !cardId) {
    console.error('Usage: node scripts/ingest_text_to_card.js <textFile> <cardId>');
    process.exit(1);
  }
  const raw = fs.readFileSync(textFile, 'utf8');
  const sections = extractSections(raw);

  const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  const idx = cards.findIndex(c => c.id === cardId);
  if (idx === -1) {
    console.error(`Card not found: ${cardId}`);
    process.exit(1);
  }
  const card = cards[idx];

  // Summarize and write
  const up = sections.upright;
  const rev = sections.reversed;

  const updated = { ...card };
  updated.meaningsUpright = {
    love: summarize(up.love),
    health: summarize(up.health),
    moneyCareer: summarize(up.moneyCareer),
    spirituality: summarize(up.spirituality),
  };
  updated.meaningsReversed = {
    love: summarize(rev.love),
    health: summarize(rev.health),
    moneyCareer: summarize(rev.moneyCareer),
    spirituality: summarize(rev.spirituality),
  };
  if (rev.description) {
    updated.descriptionReversed = summarize(rev.description, { maxSentences: 3, maxChars: 800 });
  }

  cards[idx] = updated;
  fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2), 'utf8');
  console.log(`✅ Updated card '${cardId}' from ${path.basename(textFile)}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

