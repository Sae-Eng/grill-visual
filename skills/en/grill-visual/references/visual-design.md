# Visual design for discussion

Make a page where the reader can check with diagrams "how my work changes if I choose this".
Before adding boxes of text, decide the shape of the subject and the difference to show.
Keep the way of answering (answer fields and answer bar) the same every time, and conceive the diagram anew for each issue.
Default look, choice of colors, diagram types and how to draw them, and the measures follow 01 to 05 of the foundation (`assets/foundation/`). This document covers what is specific to the discussion page.

## 0. Do not mass-produce the same thing

- For each question, consider two or three means of expression, then choose the one that shows the issue's difference best.
- Do not copy the example diagram (`assets/fig.example.svg`) or diagrams from earlier discussion pages. The build (`scripts/build.mjs`) inserts the answer fields, the answer bar and the Before→After frames, so do not write or copy them.
- Do not line up diagrams of the same type (boxes and arrows only, for example) in one round. Reuse the previous round's presentation only when there is a reason it is the best.
- The tables and lists below are starting examples. Expressions not listed here (maps, cross-sections, comic panels, scales, thermometers, clocks, floor plans) are fine when they fit the issue.

## 1. Turn the issue into a visible difference

| What to decide | Difference to show | Example expression |
| --- | --- | --- |
| Whether to batch notifications or work | Count, grouping, timing of arrival | The same three items as one notification vs. three separate notifications |
| What to tackle first | Rank, position | A small list where the same items keep their content while the order moves |
| Where to keep something | Place, visible range | Areas for list and history, switching open/done |
| Who to hand it to | Actor, connection, handover | Lanes per person with handover arrows |
| When to do it | Order, waiting time | Events on a timeline and the waiting spans |
| Differences in cost or capacity | Quantity on one scale | Bars comparing grounded values on a common scale |

### Standard means of expression (examples, not a closed list)

| Expression | Suited to | Key points |
| --- | --- | --- |
| Scene illustration | What a person does after the choice | Put person, tools and screen in one panel; show action with speech bubbles or arrows |
| Realistic UI mock-up | How a screen, notification or list looks | Simplify the parts actually seen (buttons, notifications, rows) |
| Analogy picture | A mechanism that is abstract and hard to grasp | Replace it with something familiar and briefly add how it maps to the real behaviour |
| Quantity chart | Differences in count, time or cost | Line up only grounded values on one scale |
| Step player | Order, handover, change of state | Three to five frames. ▶ advances one frame; it plays automatically only when "Play" is pressed |

Compare with the same input and the same scale. Briefly add the condition you changed and where the change shows.
Label provisional examples and counts as such; never make made-up numbers look like measurements or predicted effects.
Do not pack several relationships into one sheet; let the overview lead to each issue's diagram.

### Write the order before drawing

For each question, write the chosen expression as an order (`order` in page.json) in at most two lines before drawing.
The format and examples are in "Diagram orders" in [data.md](data.md). The main agent considers two or three candidates; the order contains only the chosen one.
Line up the orders of one round and check that the "means" are not all the same type.

## 2. Arrange the structure and look of the diagram

- Elements depict the subject. Use rows for work, a notification panel for notifications, an area for a storage location.
- Arrows explain "what moves which way". Avoid decorative or meaningless all-to-all links.
  Make line ends meet their targets, and do not run lines over text or other elements.
- Show important differences by position, size and count; color and icons support understanding.
  Keep color meanings consistent and show state in text too. One main accent color and a few state colors.
- Put the overview in the first screen and lead the eye from diagram to short explanation to options.
  Give the diagram enough area to be the protagonist. Do not make everything a repeat of the same card.
- Grade headings, body and notes. Give Japanese body text a comfortable line height and measure;
  fold long passages. Keep advantages, inconveniences and the reason for the recommendation readable without opening anything.
- Draw illustrations with SVG shapes. A head and a torso are enough for a person. Convey meaning by position, direction and what they hold rather than expression or detail.
- Lay out for a PC screen so that diagram and options read comfortably.
  If mobile is also requested, stack diagram and options vertically and do not shrink text too much.

## 2.5 Draw the Before→After of a decision

- Do not just put text in boxes and connect them with arrows. Draw the very thing that changes (counts, order, screens, people's movement, walls or exits).
- Draw before and after the same way and on the same scale, so only the differences catch the eye.
- Show which is the future with color (gray background before, decision color after) and the words "Before" and "After".
- Under the diagram, write one line each for before and after.

## 2.6 Draw diagrams that change with options as one base plus layers

Do not draw the whole diagram for each option. Draw what is the same in every option (the base) once, and make only what changes into layers (`<g data-layer="A">`).
There is no limit on characters or parts. The aim is to reduce overlap without narrowing the range of expression.

- Before drawing, decide "what changes". Put in layers only what the order lists under "layers".
- Draw the base with the same example and scale, and stack the layers on top of it. Do not change scale or layout per option (it would make comparison impossible).
- A decision's Before→After points to different layers of the same fragment (`before: {layers: ["N"]}`). If the before state is not one of the options, add a layer such as `N` (now).
- For multiple-choice questions the chosen options' layers are shown on top of each other, so draw them to survive stacking.
- Frames of a step player follow the same idea, stacked with `data-frame` (only that frame) or `data-step` (from that frame on).
- Example: [../assets/fig.example.svg](../assets/fig.example.svg). Rules: "Diagram fragments" in [data.md](data.md).

## 3. Give interactions a comparative meaning

Choosing an option changes the display of the same example. Do not settle for changing a tab's color or swapping explanations.
Provide only interactions that deepen understanding of the question, such as reordering, filtering or the order of processing.

- The build adds the recommendation label ("Showing option A · not chosen"), option switching, step-player buttons and frame display, `fieldset/legend` and the answer fields. The main agent draws the picture that changes inside them (layers and frames).
- Answers start empty.
- A selection is an unsent memo. It does not count as a confirmed decision. Hold can also be chosen.
- Short animations that make movement easy to follow (about 150 to 260 ms) are fine.
- A step player has previous, next and play/stop buttons and shows which frame it is on.
  No loops that run just by opening, no scroll-linked motion, no blinking. Manual stepping works under `prefers-reduced-motion`.
  Prefer immediate updates for keyboard use and stop motion under `prefers-reduced-motion`.
- Use standard elements such as radio buttons, buttons and `details`, with labels and visible focus.
  Describe groups with `fieldset/legend` and give diagrams alternative text.
- The build inserts the answer fields and answer bar from `assets/frame/`. Do not change their shape or behaviour.
  Results of actions such as copying are announced with `role="status"`, and the success message matches what actually happened.
- The basic diagram and the option descriptions stay readable without JavaScript.
  Put whether anything is saved or sent, and what disappears on reload, where the user can see it.

## 4. The build handles HTML, CSS and JavaScript

- `build.mjs` inserts the page's CSS and JavaScript (the foundation's tokens.css and parts.js, answer fields and answer bar, option switching, step-player buttons, display of layers and frames) from `assets/frame/` and the foundation. The model writes no CSS or `<script>`.
- Write diagram fragments with SVG and foundation variables only. To use parts, call parts.js from a `.js` fragment ("Diagram fragments" in [data.md](data.md)).
- The assembled page uses only standard CSS, SVG and JavaScript and needs no network at runtime. Do not add Tailwind CSS, daisyUI or a CDN. If an icon is needed, draw it as SVG inside the fragment (keep the license when copying from Lucide or similar).

## What to check in the browser

In the browser, check on one representative PC screen that diagram connections, option display and reflection into the memo actually work.
Limit checks to what the change touches; design and check for phones only when that is an explicit requirement.
