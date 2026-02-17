# Complete Guide: Updating All Cards with Meanings

## Overview
This guide will help you update all 78 tarot cards in `apps/mobile/src/data/tarot/cards.json` with the meanings you choose.

## ✅ Completed
- Question input section removed from home screen
- Card structure is ready for real meanings

## Card Structure Required

Each card needs these fields updated:

```json
{
  "meaningsUpright": {
    "love": "Actual love meaning when upright",
    "health": "Actual health meaning when upright",
    "money": "Actual money meaning when upright",
    "career": "Actual career meaning when upright",
    "spirituality": "Actual spirituality meaning when upright"
  },
  "meaningsReversed": {
    "love": "Actual reversed love meaning",
    "health": "Actual reversed health meaning",
    "money": "Actual reversed money meaning",
    "career": "Actual reversed career meaning",
    "spirituality": "Actual reversed spirituality meaning"
  },
  "descriptionReversed": "Full reversed description"
}
```

## Step-by-Step Process

1. **Choose your source** for card meanings (your own text or a reference you have rights to use).
2. **Find the category sections**:
   - Love
   - Health
   - Money
   - Career
   - Spirituality
3. **Copy the meanings** for both upright and reversed positions.
4. **Update the card in cards.json**:
   - Replace placeholder text in `meaningsUpright`
   - Replace placeholder text in `meaningsReversed`
   - Update `descriptionReversed` with the full reversed description
5. **Save and test** – the app will validate the structure automatically.

## Current Status

- ✅ The Fool – Has real meanings (example)
- ⏳ All other cards – Need real meanings

## Tips

- Look for sections titled Love, Health, Money, Career, Spirituality.
- Both upright and reversed meanings are usually on the same page or source.
- Copy the full text, not just keywords.
- Keep the descriptions detailed and meaningful.
- The reversed description is usually a separate section.

## Validation

After updating, the app will automatically validate:
- All required fields are present
- Field types are correct
- Structure matches the schema

## Quick Reference: All 78 Cards

### Major Arcana (22 cards)
1. The Fool ✅
2. The Magician ⏳
3. The High Priestess ⏳
4. The Empress ⏳
5. The Emperor ⏳
6. The Hierophant ⏳
7. The Lovers ⏳
8. The Chariot ⏳
9. Strength ⏳
10. The Hermit ⏳
11. Wheel of Fortune ⏳
12. Justice ⏳
13. The Hanged Man ⏳
14. Death ⏳
15. Temperance ⏳
16. The Devil ⏳
17. The Tower ⏳
18. The Star ⏳
19. The Moon ⏳
20. The Sun ⏳
21. Judgement ⏳
22. The World ⏳

### Minor Arcana (56 cards)
- Wands: Ace, 2–10, Page, Knight, Queen, King (14 cards)
- Cups: Ace, 2–10, Page, Knight, Queen, King (14 cards)
- Swords: Ace, 2–10, Page, Knight, Queen, King (14 cards)
- Pentacles: Ace, 2–10, Page, Knight, Queen, King (14 cards)

Total: 78 cards to update
