# 02 Look and direction

The defaults are only typeface, text scale, spacing, lines and corners. Color, the look of parts, layout and diagrams are decided by the subject.
The values are in `assets/tokens.css`. This page explains why those values, and how to choose a direction.

## Defaults (kept in every direction)

### Typeface and text scale

| Use | Size | Line height | Typeface |
|---|---|---|---|
| Body | 15px | 1.7 | The system sans-serif (Hiragino Sans → Noto Sans JP → system-ui) |
| Small text, tables, diagram captions | 13px | 1.5 | Same |
| Area names, item tags | 12px | 1.4 | Monospace, gray |
| Headings | 17 / 20 / 26px | 1.4 | Bold sans-serif |
| Numbers, dates, IDs, file names | Same as surroundings | — | Monospace, digits aligned |

- Nothing smaller than 11px (the measure in 05 stops it).
- Do not make headings too large. Grade by weight and color rather than size. Bold only for headings and large numbers.
- About 40 full-width characters per line (`--measure: 40em`).


### Spacing, lines and corners

- Choose spacing from the steps 4, 8, 12, 16, 24, 32, 48px. Leave at least twice the inner spacing between groups.
- Do not put areas in boxes. Head each with an ink rule (1.5px) and a small monospace area name, and divide the inside with thin rules (1px).
- Do not separate things with stacked shadows and frames.
- Corners are 4px (tags 3px). No rounded corners over 10px.
- Focus is a 2px ink line with a yellow ring. Aim for 44px targets for things you can press.


## Menu of directions

Choose one from the subject and write it in `<html data-direction="…">`. The colors in tokens.css and the look of the parts switch.

| Direction | Suited subjects | Colors | Look of parts | data-direction |
|---|---|---|---|---|
| Blueprint and review sheet (default) | Mechanisms, design, reviews, plans, discussions | White ground, ink, one indigo | Faint grid behind diagrams, dashed areas with monospace names, monospace numbers, tags as small squares with a color dot | `blueprint` |
| Instrument panel | State, numbers, progress, comparison | Light gray ground, white surfaces, one blue-green | Cells divided by rules with large numbers, state tags | `instrument` |
| Paper document | Reading, procedures, explanations | Near-white gray ground (not off-white), ink, one blue-black | No grid, narrow paragraphs, diagrams with rules above and below only | `paper` |
| Magazine feature | Showing one story, presentations | From the subject | One large picture, headings set with the picture | No set yet. Create it when used and add it here and to tokens.css |

- Once a direction is chosen, carry the whole page through in it.
- The accent color may change to fit the subject (override `--accent` and `--accent-soft`). Follow the rules below when changing it.
- When adding a new direction set, write both light and dark values in tokens.css and pass html-check on a sample.


## Choosing colors

- One accent color. Under 10% of the screen, only for the protagonist, "now" and things you can press.
- Keep state colors separate from the accent (good = green, bad = red, to check = ochre). Write state in text as well as color.
- Avoid pure black and pure white for grays; give them a slight tint (ink `#16191d` and so on).
- Choose 4 to 6 colors by assigning roles from the subject. Aim for 60-30-10 for ground, surfaces and accent.
- When adding colors, match lightness in OKLCH.
- At most four colors per diagram (ground, text, gray, white and black are not counted).
- In dark mode, darken the ground (not pure black, `#111417`) and make surfaces slightly lighter than the ground so they lift. Make accent and state colors pale and less saturated (saturated colors on a dark ground flicker). The ground does not change by direction; only the accent changes per direction. Body text to ground is at least 4.5:1 (the default is 15.9:1).
