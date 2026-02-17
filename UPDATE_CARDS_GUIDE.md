# Guide for Updating Cards with Category Meanings

## Overview
Each card needs to be updated with:
1. `meaningsUpright` - Category-specific meanings (love, health, money, career, spirituality) when upright
2. `meaningsReversed` - Category-specific meanings when reversed
3. `descriptionReversed` - Full description when the card is reversed

## Structure

Each card should have this structure:

```json
{
  "id": "card_id",
  "name": "Card Name",
  // ... existing fields ...
  "meaningsUpright": {
    "love": "Love meaning when upright",
    "health": "Health meaning when upright",
    "money": "Money meaning when upright",
    "career": "Career meaning when upright",
    "spirituality": "Spirituality meaning when upright"
  },
  "meaningsReversed": {
    "love": "Love meaning when reversed",
    "health": "Health meaning when reversed",
    "money": "Money meaning when reversed",
    "career": "Career meaning when reversed",
    "spirituality": "Spirituality meaning when reversed"
  },
  "descriptionReversed": "Full description when card is reversed"
}
```

## Source
Use your chosen reference for each card to get:
- Category-specific meanings (Love, Health, Money, Career, Spirituality)
- Both upright and reversed meanings
- Full reversed description

## Example: The Fool
See `CARD_UPDATE_TEMPLATE.json` for a complete example.

## Status
- ✅ The Fool - Updated with all categories
- ⏳ Remaining 33 cards need to be updated

## Quick Reference
All cards need these fields added:
- `meaningsUpright` (object with 5 categories)
- `meaningsReversed` (object with 5 categories)
- `descriptionReversed` (string)

