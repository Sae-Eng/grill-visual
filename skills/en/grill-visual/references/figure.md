# Drawing the diagrams

After the main agent has written page.json and the orders (`order`), it writes each question's diagram to `fig/`, one by one.
Do not hand diagrams to subagents. In the rebuild record, 16 of the 19 diagram helpers re-read html-check.mjs and their brief, spending about 46k tokens and about 2.0 dollars per diagram. Rounds drawn by the main agent stayed under 10k tokens per diagram (estimate).

## How to draw

- Numeric diagrams (horizontal bars, stacks, time bands, tiles) are not written as SVG. Write only the type, numbers and labels to `fig/qNN.json` (the format is "Numeric diagrams" in [data.md](data.md)). The build decides coordinates, so there is less to write and think about. Draw by hand only scenes, screen mock-ups and diagrams that fit no type.
- Scenes (people, AI, documents, flows) are drawn in `fig/qNN.js` by calling the parts in the foundation's parts.js (`assets/foundation`) (`man`, `bot`, `doc`, `flow`, `note` and so on; the list is "parts.js" in the foundation's references/04-parts.md). The parts carry their own shape, so this is shorter than hand-written SVG. Example: [../assets/fig.example.js](../assets/fig.example.js).
- Write only new questions and diagrams to redraw (adding layers, fixing breakage). Section diagrams and the summary's finished-picture and mechanism diagrams follow the same rules. Do not draw the dependency map; the build draws it (only when drawing it by hand, add the tag marks described in "Diagram fragments" in [data.md](data.md)).
- Write all new diagrams in one message with parallel Write calls (to reduce the number of calls). Do not Read back the diagrams or page.json you wrote (it bloats the main conversation). Fix with small Edits.
- When everything is written, run `build.mjs` and `verify.mjs` as one command (steps 4 and 5 in SKILL.md). verify measures every option, frame and dark mode, so there is no per-diagram check.
- To fix and check just one diagram, write a check page and run html-check on it.

```sh
node {grill-visual}/scripts/build.mjs {discussion folder} --fig {ID}
node {this skill}/assets/foundation/scripts/html-check.mjs {discussion folder}/fig/{fragment name}.check.html
```

The first command writes a check page laid out per layer and frame (`fig/q01.check.html`, `fig/map.check.html` and so on).

## Rules (the gist of foundation 01 and 02)

- The picture is the protagonist. Think first of a scene (a person doing something), a realistic screen mock-up or a visual analogy, not boxes and arrows alone. One means of expression per diagram.
- Even with an analogy, the content shown is the real thing with real names (file names, screen parts, numbers). Mark made-up screens "example".
- Show the "difference" in the order with the same example and the same scale. Use only numbers with grounds. Mark estimates "estimate".
- Text is 12 or larger in viewBox units (headings 13 to 15). About four protagonists. Put a label near every line and arrow.
- Use foundation variables by name for color (`var(--ink)` `--sub` `--mute` `--line` `--frame` `--surface` `--paper` `--accent` `--accent-soft` `--ok` `--ok-soft` `--ng` `--ng-soft` `--q` `--q-soft`). Accent only for the protagonist and things you can press. At most four colors per diagram (background, text and gray are not counted). Write state in text as well as color.
- Corner radius 4 (tags 3). No shadows, gradients, decorative numbers or emoji.

## Fragment format

- One `<svg viewBox="0 0 520 H" role="img" aria-label="description">…</svg>`. Width 520 for question diagrams; 1000 for the dependency map, section diagrams, the summary's finished picture and full-width mechanism diagrams; 500 for diagrams in the summary's two columns. Height follows the content. Do not write `<style>`, `<script>` or answer fields.
- **Draw the base only once.** Wrap only what changes between options in `<g data-layer="A">` (`data-layer="A B"` shows in both A and B). Everything outside `data-layer` is the base and always shows.
- Base text that disappears in some option does not go in the base; put it in the layers of the options where it stays (`data-layer="N C"` and so on). In the base it would overlap the layer's text.
- For multiple-choice questions the chosen options' layers are shown on top of each other, so draw them so that they do not collide when stacked (put each option on its own row).
- A step player uses `<g data-frame="2">` (only that frame) or `<g data-step="2">` (from that frame on). The number of frames follows the order.
- Prefix marker ids with the question ID, as in `<defs><marker id="q01-ar" …>`.
- To draw with the parts in parts.js, write `fig/q01.js` instead of `.svg`, as the body of a function that uses the parts and `return`s the `<svg…>` string. The list of parts is the "parts.js" table in the foundation's references/04-parts.md.
