# Foundation

The foundation for the look and the measures of grill-visual's pages. `build.mjs` and `verify.mjs` read this first.
This is a copy bundled with grill-visual.

## Map

| Level | File | Content | When to read |
|---|---|---|---|
| 01 Preferences and principles | [references/01-preferences.md](references/01-preferences.md) | Pictures first, real things and names, level of detail, nesting, fresh ideas each time, sticking to a direction, combinations to avoid | Every time |
| 02 Look and direction | [references/02-look.md](references/02-look.md) | Defaults (typeface, text scale, spacing, lines, corners), the menu of directions, choosing colors | Every time. Choose a direction from the subject |
| 03 Diagram and page types | [references/03-types.md](references/03-types.md) | Table of diagram types, diagram rules, how to draw, page types | When deciding a diagram's form |
| 04 Parts and values | [references/04-parts.md](references/04-parts.md) | How to use `assets/tokens.css` (variables) and `assets/parts.js` (line drawings) | When starting to draw |
| 05 How to check | [references/05-checks.md](references/05-checks.md) | The measure `scripts/html-check.mjs`, scoring, looking in the browser | After making something |

## What is inside

- `assets/tokens.css`: variables for color, text and spacing, light and dark.
- `assets/parts.js`: diagram parts (people, AI, documents, arrows, tags and so on), called from `.js` fragments.
- `scripts/html-check.mjs`: the measure. Opens a page in Chromium and measures overflow, overlap, text size and more.
