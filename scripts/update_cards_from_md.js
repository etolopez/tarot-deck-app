/**
 * @file update_cards_from_md.js
 * @description One-off helper to rebuild tarot card meanings in cards.json using
 * the structured markdown source at `/Users/eto/Downloads/tarot_original_meanings.md`.
 *
 * - Preserves existing card ids, suits, numbers, and assets from cards.json.
 * - Replaces description/descriptionReversed and category meanings (upright/reversed).
 * - Splits "Money & Career" into both money and career fields.
 * - Keywords become a string summary for meaningUpright/meaningReversed and an array for keywords.
 *
 * Run with: `node scripts/update_cards_from_md.js`
 */

const fs = require("fs");
const path = require("path");

// Absolute path to the provided markdown source.
const MD_PATH = "/Users/eto/Downloads/tarot_original_meanings_expanded.md";
// cards.json relative to repo root.
const JSON_PATH = path.resolve(
  __dirname,
  "..",
  "apps",
  "mobile",
  "src",
  "data",
  "tarot",
  "cards.json"
);

/**
 * Normalize a card name to a lookup-safe key.
 * @param {string} name
 * @returns {string}
 */
const normalizeName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Extracts a subsection by heading within a text block.
 * @param {string} text Full text block.
 * @param {string} heading Heading label after "### ".
 * @returns {string}
 */
const extractSection = (text, heading) => {
  const regex = new RegExp(
    `\\s*###\\s+${heading}\\n([\\s\\S]*?)(?=\\n\\s*###\\s+|\\n\\s*##\\s+|$)`,
    "i"
  );
  const match = text.match(regex);
  return match ? match[1].trim() : "";
};

/**
 * Parses keywords list into an array.
 * @param {string} keywordsBlock
 * @returns {string[]}
 */
const parseKeywords = (keywordsBlock) => {
  const combined = keywordsBlock.replace(/^-\s*/gm, "").replace(/\n/g, " ").trim();
  if (!combined) return [];
  return combined
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
};

/**
 * Parse a single card section from markdown.
 * @param {string} section
 * @returns {{
 *   name: string;
 *   srcId: string;
 *   keywords: string[];
 *   description: string;
 *   descriptionReversed: string;
 *   meaningsUpright: {love:string;money:string;career:string;health:string;spirituality:string};
 *   meaningsReversed: {love:string;money:string;career:string;health:string;spirituality:string};
 *   meaningUpright: string;
 *   meaningReversed: string;
 * }}
 */
const parseCardSection = (section) => {
  const headerMatch = section.match(/^#\s+(.+)/);
  if (!headerMatch) throw new Error("Missing card header");
  const name = headerMatch[1].trim();

  const idMatch = section.match(/-\s+id:\s*`([^`]+)`/);
  const srcId = idMatch ? idMatch[1].trim() : "";

  const uprightHeading = section.match(/##\s+Upright/i);
  const reversedHeading = section.match(/##\s+Reversed/i);
  if (!uprightHeading) throw new Error("Missing Upright section");

  const uprightStart = uprightHeading.index + uprightHeading[0].length;
  const reversedStart = reversedHeading ? reversedHeading.index : -1;

  const cleanBlock = (block) =>
    block.replace(/^\s*-{3,}\s*$/gm, "").trim();

  const uprightBlock = cleanBlock(
    section.slice(uprightStart, reversedStart === -1 ? undefined : reversedStart)
  );
  const reversedBlock =
    reversedStart === -1
      ? ""
      : cleanBlock(
          section.slice(reversedStart + reversedHeading[0].length)
        );

  const uprightKeywords = parseKeywords(
    extractSection(uprightBlock, "Keywords")
  );
  const reversedKeywords = parseKeywords(
    extractSection(reversedBlock, "Keywords")
  );

  const description = extractSection(uprightBlock, "General");
  const descriptionReversed = extractSection(reversedBlock, "General");

  const love = extractSection(uprightBlock, "Love & Relationships");
  const loveR = extractSection(reversedBlock, "Love & Relationships");

  const moneyCareer = extractSection(uprightBlock, "Money & Career");
  const moneyCareerR = extractSection(reversedBlock, "Money & Career");

  const health = extractSection(uprightBlock, "Health");
  const healthR = extractSection(reversedBlock, "Health");

  const spirituality = extractSection(uprightBlock, "Spirituality");
  const spiritualityR = extractSection(reversedBlock, "Spirituality");

  return {
    name,
    srcId,
    keywords: uprightKeywords,
    description,
    descriptionReversed,
    meaningsUpright: {
      love,
      moneyCareer,
      health,
      spirituality,
    },
    meaningsReversed: {
      love: loveR,
      moneyCareer: moneyCareerR,
      health: healthR,
      spirituality: spiritualityR,
    },
    meaningUpright: uprightKeywords.join(", "),
    meaningReversed: reversedKeywords.join(", "),
  };
};

/**
 * Main runner: load markdown + cards.json, merge meanings, write file.
 */
const run = () => {
  const md = fs.readFileSync(MD_PATH, "utf8");
  const baseCards = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

  /**
   * Collapse any legacy money/career fields into the new combined shape.
   * @param {Record<string, string>} source
   * @param {Record<string, string>} parsed
   */
  const buildMergedMeanings = (source = {}, parsed = {}) => {
    const mergedLove = parsed.love || source.love || "";
    const mergedHealth = parsed.health || source.health || "";
    const mergedMoneyCareer =
      parsed.moneyCareer ||
      source.moneyCareer ||
      source.money ||
      source.career ||
      "";
    const mergedSpirituality = parsed.spirituality || source.spirituality || "";

    return {
      love: mergedLove,
      health: mergedHealth,
      moneyCareer: mergedMoneyCareer,
      spirituality: mergedSpirituality,
    };
  };

  const sections = md
    .split(/\n(?=#\s)/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("# "))
    // Only keep sections that declare an id (skips TOC/header noise).
    .filter((s) => s.includes("- id:"));

  const parsedCards = sections
    .map((section) => {
      try {
        return parseCardSection(section);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const parsedByName = new Map(
    parsedCards.map((c) => [normalizeName(c.name), c])
  );

  let updated = 0;
  let missing = 0;

  const merged = baseCards.map((card) => {
    const key = normalizeName(card.name);
    const parsed = parsedByName.get(key);
    if (!parsed) {
      missing += 1;
      return card;
    }

    updated += 1;
    const meaningsUpright = buildMergedMeanings(
      card.meaningsUpright,
      parsed.meaningsUpright
    );
    const meaningsReversed = buildMergedMeanings(
      card.meaningsReversed,
      parsed.meaningsReversed
    );

    return {
      ...card,
      keywords: parsed.keywords,
      meaningUpright: parsed.meaningUpright || card.meaningUpright,
      meaningReversed: parsed.meaningReversed || card.meaningReversed,
      description: parsed.description || card.description,
      descriptionReversed:
        parsed.descriptionReversed || card.descriptionReversed,
      meaningsUpright,
      meaningsReversed,
    };
  });

  fs.writeFileSync(JSON_PATH, JSON.stringify(merged, null, 2));

  console.log(
    JSON.stringify(
      {
        updated,
        missing,
        totalParsed: parsedCards.length,
        totalCards: merged.length,
      },
      null,
      2
    )
  );
};

run();

