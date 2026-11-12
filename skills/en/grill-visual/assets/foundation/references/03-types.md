# 03 Diagram and page types

Choose a type from what you want to show. A type is an underlay before drawing; how to draw is thought out each time (01).

## Standard means of expression

- Scene illustration: put person, tools and screen in one panel. A head and torso are enough for a person; convey meaning by position, direction and what they hold.
- Realistic screen mock-up: a PR screen, notifications, lists, tables. Mark made-up ones "example".
- Analogy picture: replace with something familiar; the content on it is the real thing with real names (01).
- Numeric chart: only grounded values, on one scale.
- Step player: for following an order or a handover. Three to five frames; ▶ advances one frame; plays automatically only when "Play" is pressed. Never keeps moving just because it was opened.
- Not limited to these. Consider two or three candidates, then choose.


## Table of diagram types

Before drawing, choose a type and write the type and skeleton (areas, direction of flow, levels) in one sentence. The sentence appears above the page's diagram as the "picture type".
Types not in the table are fine, but always write the sentence. Once the skeleton is decided, do not leave it as gray boxes and lines; redraw it as a picture.

Example sentence: "Flow chart. Three areas left to right (write → check → publish). Protagonists are the PR card and the CI gate."

| What to show | Type | Example drawing |
|---|---|---|
| Order of processing and branches | Flow chart | Gates (barriers) on a road and signposts at forks |
| Order of handovers between people, AI and CI | Sequence | Panels of a person and an AI handing over a PR card |
| States and transitions | State diagram | A board whose tags are swapped, a gate whose lamp changes color |
| Flow across owners | Swimlane | A row of desks per owner, documents passing between desks |
| Things and their connections | Structure diagram | Buildings and roads, with what travels through them named |
| Events over time | Timeline, Gantt | Sticky notes on a band of dates |
| Nesting, scope | Nesting | A floor plan, sections of a shelf |
| Stacked levels | Layers | Shelves, a cross-section of strata |
| Comparing numbers | Bar chart | Only grounded values, on one scale |
| Before and after | Before/After | Draw before and after in the same frame and scale, changing only what differs |
| Shape of data | ER diagram | Tables and lines, with real column names |

- If a table or text is enough, do not draw. Cutting is the best move.
- If one sheet has too many things (as a guide, over 9 things or 12 arrows), split into an overall picture and close-ups.
- Emphasize one or two places.


## Diagram rules

| Rule | Content |
|---|---|
| One-line test | You can say in one sentence what the diagram conveys. If not, split into close-ups |
| About four protagonists | About four things the eye follows per sheet. If more, group them or move them to a close-up |
| One means per sheet | Do not mix roads, ladders, rings, bands and so on in one sheet |
| Labels on lines and arrows | An arrow is "what moves which way". No unlabeled lines. Do not run lines over text or things |
| As many colors as meanings | One accent plus state colors, at most four per sheet. With many states, use text tags |
| Labels right next to things | Do not rely on distant speech bubbles or legends |
| Numbers on things, not stacked | About five numbers per sheet at most |
| Where the eye goes first | Where the eye goes first is the protagonist of the one line |


## How to draw (blueprint line drawing)

- A faint grid (16px) on the ground. Areas are dashed frames with a monospace name at the top left.
- Three line weights: areas 1, things and flows 1.5, the main flow 3.
- Draw lines horizontally and vertically with rounded corners. One reading direction (left to right or top to bottom).
- Arrowheads are open Vs, the same size regardless of line weight.
- Draw things with the same lines, filled with the surface color. Accent only for the protagonist and things you can press.
- Draw diagrams at about viewBox width 1000 with text 12 or larger. On narrow screens scroll sideways instead of shrinking (`.fig` in 04).


## Page types

| Type | Content | Owned by |
|---|---|---|
| Page head | Put what the document is and what you want from the reader first, nested under headings. The overall diagram right after | This foundation (example `assets/sample.html`) |
| Three levels (overall → close-up → source and tables) | What is pressed in the overall diagram is drawn large in a close-up, from which you go on to the source and tables. A band at the top shows the current level and goes back on press. Previous and next carry the destination's name | This foundation |
| Discussion page and summary | Map of issues, a diagram per question, answer fields, before and after of decisions, then the summary | grill-visual |
| PR descriptions, plans, reports | HTML instead of Markdown, showing diffs, order and numbers with diagrams and tables | Decided by the maker |
