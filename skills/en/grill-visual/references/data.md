# Discussion data (page.json)

The authoritative data of questions and decisions, kept in the discussion folder. `scripts/build.mjs` assembles `index.html` from it and the diagram fragments (`fig/`).
Keep writing discussion.md as the human-readable record, and keep it consistent with page.json (version, IDs, answers, decisions).
Example: [../assets/page.example.json](../assets/page.example.json) (a made-up discussion, "add notifications to a to-do app", 6 questions and 6 decisions, after it ended).

```
artifacts/grill-visual/<topic>/
├── page.json        questions, decisions, history (this document)
├── fig/qNN.svg      diagram fragment per question (written by the main agent; .js is fine too)
├── discussion.md    the record
├── tasks.json       tasks (when done; see "Task data" below)
├── index.html       the assembled discussion page (never edit by hand)
└── summary.html     the assembled summary (never edit by hand)
```

## The whole page

| Field | Type | Meaning |
|---|---|---|
| `version` | number | Version. Same number as discussion.md. Increase by one each time the page is updated after answers |
| `date` | string | Date of the version (YYYY-MM-DD) |
| `round` | number | The current round. "Round N" in the header |
| `status` | `open`, `ended` | `ended` shows the end tag |
| `limits` | `{q, r}` | Limits. `null` when not given. "(limit N)" is added only when there is a number |
| `direction` | string | A direction set from foundation 02 (`<html data-direction>`). Default `blueprint` |
| `title` | string | The goal in one sentence (h1) |
| `lead` | string | What this round decides |
| `intro` | array of sections | Sections before the dependency map (diagnostics, measurements, answers to the overall note). `[]` if none |
| `map` | section | The dependency map of the issues. The build draws tags and lines from `nodes` (only when `figs` is written does it use that diagram; see "Diagram fragments" below) |
| `end` | string | Text of the end tag when `status` is `ended` |
| `questions` | array of questions | Questions asked. Issues not yet asked appear only on the map |
| `decisions` | array of decisions | Decided questions. IDs match the questions |
| `rounds` | array of rounds | History. Questions asked per round, interpretations, corrections, new issues |
| `summary` | section | When done. Sentences and diagrams of the summary ("`summary` fields" in [summary.md](summary.md)) |

The build counts questions asked as the number of `questions` and decisions as the number of `decisions`. Do not write counts here.

### Sections (elements of `intro`, and `map`)

| Field | Meaning |
|---|---|
| `id` | Anchor (for `intro`; optional) |
| `eyebrow` | Small heading (e.g. `MAP`) |
| `title` `lead` | Heading and one or two sentences |
| `figs` | Array of fragment paths, laid out top to bottom. Omit for `map` and let the build draw it |
| `nodes` | `map` only. Array of issue tags `[{id, name, after}]`. `name` is the short name on the tag (up to 16 characters; wraps at two lines). Dependencies come from the questions' `after`; write `after` only for issues not yet asked. If omitted, all questions are laid out by title |
| `note` | A short note under the diagram (optional) |
| `details` | Folded parts `[{summary, html}]` (optional). `html` takes tables and the like as is |

## Questions (elements of `questions`)

| Field | Meaning |
|---|---|
| `id` | Of the form `Q01`. Never changes. The anchor is lowercase (`#q01`) |
| `round` | The round it was asked in |
| `title` | The question |
| `impact` | Impact (high, medium, low) |
| `undo` | How easy it is to undo ("can change later", "deleted things cannot come back" and so on) |
| `after` | Array of question IDs it depends on. Ask only after the prerequisites are answered |
| `multi` | `true` for a question with several choices (checkboxes) |
| `background` | Background. What is known and concrete examples. Separate facts from assumptions |
| `issue` | The issue. What is undecided, and which operation, display or practice the answer changes |
| `options` | Options `[{key, name, text, pros, cons}]`. `key` is `A`, `B` or `1`, `2`. `name` is the short name shown on the answer bar; `text` describes the option |
| `recommended` | Array of recommended `key`s |
| `why` | Why it is recommended. Shown where it can be read without opening anything |
| `order` | The diagram order ("Diagram orders" below). At most two lines |
| `fig` | Path of the diagram fragment (`fig/q01.svg` or `fig/q01.js`) |
| `fig_top` | The relationship the diagram shows (the tag at the top left of the diagram) |
| `fig_note` | A short explanation under the diagram (optional) |
| `steps` | Array of frame descriptions for a step player (when the diagram has `data-step`) |
| `details` | Detailed background and technical grounds (folded; optional) |
| `skip` | Reason for skipping (optional). Skipped questions get no answer fields |

The build decides the order: awaiting answer → skipped → decided (each in array order).

## Decisions (elements of `decisions`)

| Field | Meaning |
|---|---|
| `id` | The question ID |
| `round` | The round in which it was decided |
| `pick` | Array of chosen `key`s (the answer). The tag reads "Decided (A)" or "Decided (1, 3)" |
| `line` | What was decided, in one line of about 40 characters |
| `adopted` | What was adopted (in full) |
| `reason` | Reason. "Not recorded" if it is not in the record |
| `cost` | The inconvenience accepted |
| `rejected` | Rejected options (and conditions for reconsidering) |
| `note` | The owner's note and how it was handled (optional) |
| `before` `after` | Diagrams before and after `{fig, layers, at}`. Pointing to different layers of the same fragment keeps the same drawing and scale. `at` selects a frame; omitted means the last frame. `before: null` for a decision that changes nothing |
| `cap_before` `cap_after` | One line each for before and after |
| `same` | `true` for a decision that changes nothing. Shows one diagram and "no change between before and after" |
| `group` | Name of the group the decision belongs to in the summary |
| `wide` | `true` for a decision with large impact (shown wide in the summary) |

## Rounds (elements of `rounds`)

| Field | Meaning |
|---|---|
| `n` `version` `date` | Round number, page version issued then, date |
| `asked` | IDs of the questions asked in that round |
| `notes` | One line each: choices that differ from the recommendation, interpretations taken, corrections, issues raised from notes |

## Diagram fragments (`fig/`)

Written by the main agent and inserted into the page by the build. How to draw them is in [figure.md](figure.md).

- Numeric diagrams (horizontal bars, stacks, time bands, tiles) are written as `.json` with type and numbers, and the build (`scripts/charts.mjs`) draws the SVG. The format is "Numeric diagrams (`.json`)" below. Example: [../assets/fig.example.svg](../assets/fig.example.svg) (three options, one base drawing).

- One diagram is one `<svg viewBox="…" role="img" aria-label="description">…</svg>`. A `.js` file is written as the body of a function that can use the parts in parts.js and `return`s that string. Tables and the like may go in as `.html` as is.
- Write colors with foundation variables (`var(--ink)` and so on). Do not write CSS, answer fields or `<script>` (the build inserts them).
- **Draw the base only once.** Wrap only what changes between options in `<g data-layer="A">`. Everything outside `data-layer` is the base and always shows. `data-layer="A B"` shows in both A and B.
- A question's diagram starts with the recommended option's layer shown (the chosen option's, once decided). The option buttons and the answer choice swap layers. For multiple-choice questions the chosen options' layers are shown stacked, so draw them to survive stacking.
- A decision's before and after (`before` `after`) point to layers of the same fragment with `layers`. A layer whose name is not an option (e.g. `N` for now) may be drawn for the before state.
- A step player uses `<g data-frame="2">` (only that frame) or `<g data-step="2">` (from that frame on; shown faintly in earlier frames). Write frame descriptions in the question's `steps`, as many as there are frames.
- `id`s inside a fragment (such as arrowhead `<marker>`s) get a prefix from the build when the same fragment is placed twice.
- **When drawing the dependency map by hand (`map.figs`), draw only the shape and position of the tags.** Wrap one issue in `<a data-q="Q01">`, mark its frame with `data-tag` and the text that states its state with `data-state` (`<text data-state …>Q01</text>`). The build decides the state from page.json, rewrites the text to "Q01 · Decided (A)", "This round", "Awaiting answer", "Skipped" or "Later", and adds the color (decided = ok, this round and awaiting = accent, skipped and later = dashed mute) and the link to the question. Issues not yet asked become "Later". Rebuilding after adding answers changes the tags, so do not redraw the map for state. Do not put tag colors, links or states in aria-label.

## Numeric diagrams (`fig/qNN.json`)

The model writes no coordinates or SVG, only type, numbers, labels and layers. The build applies the same rules as hand-drawn diagrams for text size, color and layer marks. If a label does not fit in its bar or runs off the right edge, the build stops and shows the location of the field.

| Field | Meaning |
|---|---|
| `type` | `bars` (horizontal bars, including stacks and time bands) or `tiles` (a row of tiles) |
| `width` | 520 (question diagrams) or 1000 (sections, summary). 520 if omitted |
| `title` `label` | The small heading above the diagram (state the scale) and the diagram description (aria-label; required) |
| `max` `unit` `ticks` | For bars: scale maximum, unit and array of tick values |
| `rows` | Array of rows. bars: `{label, segs, after, note, layers}`; tiles: `{label, items}` |
| `segs` | Bar segments `[{v, tone, text, from}]`, stacked from the left. With `from` the segment starts at that position (time bands). `text` is the label inside the bar |
| `after` `note` | The label to the right of the bar and the note under the row |
| `layers` | What each option adds `{"A": {segs, after, note}}`. The parts outside are the base and always show |
| `marks` | Vertical dashed lines `[{v, text, layer}]` (pass lines and the like) |
| `items` `keys` | Tiles. Text or `{text, swap: {"A B": "none"}}` (replace the text in those options). `swap` needs `keys`, an array of layer names |
| `count` | The number to the right of tiles `{label, values: {"N C": "19", "A": "13"}}` |
| `legend` `foot` | Color legend `[{tone, text}]` and the note under the diagram |
| `tone` | `base` (gray fill), `accent` (strong), `soft` (light accent; default), `est` (dashed; estimate), `q` (needs checking), `ok` (good), `mute` (things that disappear) |

Example (a cost bar that changes with three options):

```json
{"type": "bars", "title": "Cost of the check (0 to 15 dollars)", "max": 15, "unit": "dollars", "ticks": [0, 5, 10, 15],
 "rows": [
  {"label": "Baseline", "segs": [{"v": 14.93, "tone": "base", "text": "Earlier round 1: 14.93 dollars (measured)"}]},
  {"label": "This check", "layers": {
    "A": {"segs": [{"v": 3}, {"v": 2, "tone": "est"}], "after": "about 3 to 5 dollars (estimate)"},
    "B": {"segs": [{"v": 0}], "after": "0 dollars extra"}}}],
 "label": "The baseline is 14.93 dollars. A is about 3 to 5 dollars, B adds 0 dollars."}
```

## Diagram orders (`order`)

The main agent writes one per question before drawing. Writing out the chosen expression briefly reduces the amount of thinking and makes it possible to see whether diagram types are skewed within a round.
Write these four items in a question's `order`, in at most two lines (the build stops at three or more).

```
Difference: <what changes with the choice; the difference shown with the same example and scale> / Means: <type of expression (scene, real screen, analogy, numeric chart, step player…)>
Protagonist: <what the eye goes to first> / Layers: <what changes per option (A = …, B = …). With frames, their number and content>
```

- Choose the means from the tables in visual-design.md. Consider two or three candidates, settle on one, and write only that.
- Layers list only what is not in the base. The base is everything outside the "layers" ("Diagram fragments" in data.md).
- So that what to draw is clear, write the difference and protagonist as things, not names ("the number of sheets to draw", not "the Q03 difference").

Examples (one per type of expression):

| Means | Order |
|---|---|
| Scene | Difference: how many times a person stops and waits between opening a PR and fixing it / Means: scene (a person at a desk and a speech bubble from the screen)<br>Protagonist: the waiting person's hourglass / Layers: A = one wait, B = three waits, C = moves on without waiting |
| Real screen | Difference: number and timing of notifications for the same three events / Means: real screen (notification cards)<br>Protagonist: the notifications on the screen / Layers: A = one, B = three, C = one at 18:00 ([fig.example.svg](../assets/fig.example.svg)) |
| Numeric chart | Difference: context size per round (same scale) / Means: numeric chart (a before line and an after line)<br>Protagonist: the after line and the 200k line / Layers: the shape of the after line changes in A, B, C |

# Task data (tasks.json)

The authoritative task data, placed in the same folder as the summary after the discussion ends. Agents read it, work through it and write back with `scripts/task.mjs` ("Writing" below).
The build writes chapter 4 of summary.html (dependency diagram, table, progress, checklist, deliverables) and `tasks.js`, and an open summary re-reads it every few seconds.
Do not export to an outside task manager or plan.md. Example: [../assets/tasks.example.json](../assets/tasks.example.json) (6 tasks from the same made-up discussion).

## The whole file

| Field | Meaning |
|---|---|
| `version` | Format version (currently 1) |
| `discussion` | The discussion folder (path from the repository) |
| `decided_in` | Which version of the discussion decided it |
| `skill_root` | Path of the implementation target, if decided (optional) |
| `for_agent` | The agent's procedure, placed at the top of the file ("Procedure" below). Array of sentences |
| `states` | State values and the words shown in the summary |
| `tasks` | Array of tasks in dependency order |
| `progress` | One sentence on how progress is counted |

## Tasks (elements of `tasks`)

| Field | Written by | Meaning |
|---|---|---|
| `id` | discussion | Of the form `T01`. Never changes |
| `title` `short` | discussion | Name of the work, and a short name for the diagram tag |
| `kind` | discussion | design, implementation, document, release, measurement, verification, judgement and so on |
| `owner` | discussion | agent, owner and so on |
| `from` | discussion | Array of IDs of the source decisions. Work not in a decision becomes a `proposal` |
| `depends_on` | discussion | Array of task IDs that must be done first |
| `proposal` | discussion | `true` for work not stated in the discussion. Check with the owner before starting |
| `steps` | discussion | Steps, done top to bottom |
| `steps_done` | agent | Number of steps done from the top |
| `files` | discussion | Files to create or change (as far as known). Write `[]` if none |
| `done_when` | discussion | Completion criteria, written as a state you can check by looking |
| `how_to_check` | discussion | How to check |
| `state` | agent | `todo`, `doing`, `done`, `blocked` (stopped; ask the owner), `dropped` (abandoned; the owner's call) |
| `run_by` | agent | Who is working on it (`main`, `sub-T07` and so on). Written by `task.mjs … doing --by` (optional) |
| `proof` | agent | Array of deliverables (file paths, commits, screenshot paths). `[]` if none yet |
| `checked` | agent | One or two lines on what was checked |
| `note` | both | Notes. When blocked, the reason goes here |

The build reports unknown states, `depends_on` pointing to missing IDs and dependency cycles.

## Writing (`scripts/task.mjs`)

After the discussion, tasks.json is written only with `task.mjs`, never by hand.
It takes a lock, reads, changes and writes, and rewrites tasks.js with `build.mjs <discussion folder> --tasks`. Two writers (the parent and a subagent) writing at once both keep their writes.

| Operation | Command (`task.mjs` means `node <this skill>/scripts/task.mjs <discussion folder>`) | Who |
|---|---|---|
| Take | `task.mjs T01 doing --by <name>` (refused unless dependencies are done; the name goes to `run_by`) | parent, subagent |
| Finish one step | `task.mjs T01 step` | parent, subagent |
| Complete | `task.mjs T01 done --proof "path" [--proof "path"] --checked "what was checked"` | parent only (after checking done_when) |
| Stop | `task.mjs T01 blocked --note "reason"` | parent, subagent |
| Drop | `task.mjs T01 dropped --note "reason"` (only when the owner decides; removed from the progress denominator) | parent |
| Reset | `task.mjs T01 todo` | parent |
| Add or change | `task.mjs patch diff.json` (adds or overwrites tasks by id, replaces other fields) | parent |

Every operation takes `--note "note"`. A subagent writes only doing and step for its own task.

## Running side by side

When two or more tasks can be taken now (all dependencies done, state todo) and their `files` overlap neither each other nor tasks in progress, chapter 4 of the summary shows them as "can run side by side" (folders overlap by prefix).
By default the parent does them one by one, lowest number first. Only when the owner explicitly asks for subagents in parallel does it hand tasks from that set to subagents (same model), one each. Tasks whose `files` overlap, tasks with remaining dependencies and tasks owned by the owner are not handed over.

## Procedure (`for_agent`)

Put the procedure the agent reads at the top of tasks.json. Use the seven lines of the example as they are; only the task.mjs path changes per discussion.

1. A task whose `depends_on` are all done and whose state is todo can be taken now. Do not take tasks with remaining dependencies until the earlier tasks are done.
2. The parent does tasks that can be taken now one by one, lowest number first. Hand them to subagents only when the owner explicitly says so.
3. Write tasks.json with task.mjs. When taking a task, `doing --by <name>`; after each step, `step`.
4. Do `steps` top to bottom. Do nothing that is not in the decisions (`from`).
5. If a way different from the decision seems necessary, stop with `blocked --note "reason"` and ask the owner.
6. Check `done_when` with `how_to_check`. The parent also checks tasks handed to subagents.
7. The parent completes with `done --proof … --checked …`. Commit only when the owner asks.
