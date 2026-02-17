# Update Card Descriptions

## Task
Update all card descriptions in `apps/mobile/src/data/tarot/cards.json` with longer, more detailed descriptions from your chosen source.

## Current Status
The cards.json file has short descriptions. Replace them with comprehensive descriptions as needed.

## Approach

1. For each card, obtain the full description text (from a source you have rights to use).
2. Update the `description` field in cards.json.

## Card List (34 cards currently in the file)
- Major Arcana: The Fool through The World (22 cards)
- Minor Arcana: Ace through Three of each suit (12 cards)

## Format
Each card should have a `description` field with a comprehensive explanation (typically 2–4 paragraphs).

## Example
Instead of:
```json
"description": "The Fool represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner's luck, improvisation and believing in the universe."
```

Use a longer description like:
```json
"description": "The Fool card represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner's luck, improvisation and believing in the universe. When The Fool appears in a reading, it often signifies a time of new opportunities and fresh starts. This card encourages you to take a leap of faith and trust in the journey ahead, even if you don't know exactly where it will lead. The Fool reminds us that sometimes the best adventures begin when we step into the unknown with an open heart and mind."
```

## Next Steps
1. For each card, copy the full description text from your source.
2. Update cards.json with the longer descriptions.
3. Ensure all 34 cards are updated.
